// #region Imports
import { $, Callbacks, instance as getDesignerInstance } from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
import { MARK_ELEMENTS_CHANGED_EVENT } from "./CodbiSwitchEditor.js";
import { openEPBuilder } from "./EPBuilder.js";
import { mirrorElementOptions, mirrorFormOptions } from "./MirrorSelect.js";
import { i18n, localizedParameterDescription } from "./i18n.js";
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
 * ## The second effect: CodBi marker badges
 * While the same **“Mark CodBi elements in the designer”** mode is on, every form element carrying a
 * `data-cb-func` attribute OR a CodBi standard-configuration CSS class (e.g.
 * `CodBi_People_Name`, `CodBi_Currency`) also gets a badge pinned to the top-left corner. It shows
 * the CodBi logo (`Symbol_CodBi.svg`) and — on hovering the widget — expands to the right to list
 * one sub-badge per functionality that is actually known to the designer
 * (`window.CodbiPluginData.detFunctionalities`, orange) and one BLUE sub-badge per applied
 * standard-configuration class (`window.CodbiPluginData.detStandards[*].classes`). Hovering one
 * functionality sub-badge expands it DOWNWARD (over the marker badge's bounds) to show the
 * `data-cb-*` parameters set on the element for that functionality, as a parameter/value table.
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

/** Persisted element property holding the CSS classes applied to the element (an array of strings). */
const CSS_CLASSES_PROPERTY = "cssclasses";

/**
 * Badge stylesheet. Injected into every document that hosts a badge (see `installBadgeStyles`),
 * because the designer stylesheet does not reach the canvas iframe.
 */
const BADGE_CSS = `
.codbi-elem-badge{position:absolute;top:4px;left:0;transform:translateX(6px);z-index:5;display:inline-flex;align-items:center;height:22px;box-sizing:border-box;overflow:hidden;background:rgba(255,255,255,.94);border:1px solid darkorange;border-radius:5px;box-shadow:0 1px 3px rgba(15,23,42,.28);font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:11px;line-height:1;color:#374151;pointer-events:none;user-select:none;white-space:nowrap}
/* Mirror badges sit in the widget's BOTTOM-LEFT corner (the function/CodBi badges keep top-left).
   They are deliberately stacked BELOW the functionality badge/popup (lower z-index), so when both
   are displayed the functionality widget's parameter table is drawn over/in front of the mirror
   badge instead of the mirror badge covering it. */
.codbi-elem-badge--bottom{top:auto;bottom:4px;left:0;z-index:4}
.codbi-elem-badge__icon{flex:0 0 auto;width:20px;height:20px;box-sizing:border-box;margin:0 1px;pointer-events:none;background-repeat:no-repeat;background-position:center;background-size:16px 16px;filter:drop-shadow(0 0 1.5px rgba(56,189,248,.85)) drop-shadow(0 0 3px rgba(37,99,235,.45))}
.codbi-elem-badge__text{display:inline-block;max-width:0;overflow:hidden;opacity:0;pointer-events:none;transition:max-width .25s ease,opacity .25s ease,padding .25s ease}
*:hover>.codbi-elem-badge:not(.codbi-elem-badge--empty){border-color:#c96a00;background:#fff7ed}
*:hover>.codbi-elem-badge:not(.codbi-elem-badge--empty) .codbi-elem-badge__text{max-width:640px;opacity:1;padding:0 8px 0 0}
.codbi-elem-badge--open .codbi-elem-badge__text{max-width:640px;opacity:1;padding:0 8px 0 0}
/* The marked (highlight) frame. The visible rounded border + darkorange glow are drawn by a
   ::after OVERLAY (on top of the element) rather than by the element itself: form-designer
   content cells fill themselves with child wrappers whose own rectangular background would cover
   the element's rounded corners, and their overflow would clip an outer glow. The overlay is
   always roundrect and sits above every child, so the highlight is readable on any element. */
.codbi-elem-marked{position:relative!important;overflow:visible!important;z-index:2}
.codbi-elem-marked::after{content:"";position:absolute;inset:-2px;pointer-events:none;box-sizing:border-box;border:2px solid darkorange;border-radius:10px;box-shadow:0 0 0 1px rgba(255,140,0,.30),0 0 10px 3px rgba(255,140,0,.55);z-index:9999}
.codbi-mirror-icon{background-image:url("${MIRROR_ICON_URL}");background-repeat:no-repeat;background-position:center;background-size:contain}
.codbi-mirror-icon svg{display:none}
.codbi-elem-badge--funcs{overflow:visible}
.codbi-func-icon{background-image:url("${CODBI_LOGO_URL}")}
.codbi-func-list{display:inline-flex;align-items:center;gap:4px;max-width:0;overflow:hidden;opacity:0;pointer-events:none;transition:max-width .25s ease,opacity .25s ease,padding .25s ease}
*:hover>.codbi-elem-badge--funcs>.codbi-func-list{max-width:2000px;overflow:visible;opacity:1;padding:0 6px 0 2px;pointer-events:auto}
.codbi-func-item{position:relative;display:inline-flex;align-items:center;height:18px;box-sizing:border-box;padding:0 6px;border:1px solid #c96a00;border-radius:4px;background:#fff7ed;color:#7c2d12;font-size:11px;line-height:1;white-space:nowrap;pointer-events:auto;opacity:0;transition:opacity .25s ease}
/* The CSS-standard-configuration-class sub-badges are BLUE to distinguish them from the orange
   functionality sub-badges. */
.codbi-css-item{position:relative;display:inline-flex;align-items:center;height:18px;box-sizing:border-box;padding:0 6px;border:1px solid #1d4ed8;border-radius:4px;background:#eff6ff;color:#1e40af;font-size:11px;line-height:1;white-space:nowrap;pointer-events:auto;opacity:0;transition:opacity .25s ease}
/* The HOLISTIC standard-configuration sub-badges are GREEN to mark elements that a runtime
   selector-resolved (holistic) configuration applies to. */
.codbi-holistic-item{position:relative;display:inline-flex;align-items:center;height:18px;box-sizing:border-box;padding:0 6px;border:1px solid #15803d;border-radius:4px;background:#ecfdf5;color:#14532d;font-size:11px;line-height:1;white-space:nowrap;pointer-events:auto;opacity:0;transition:opacity .25s ease}
/* Reveal the sub-badges only once the list is expanded (prevents a flash while overflow is still hidden). */
*:hover>.codbi-elem-badge--funcs>.codbi-func-list>.codbi-func-item{opacity:1}
*:hover>.codbi-elem-badge--funcs>.codbi-func-list>.codbi-css-item{opacity:1}
*:hover>.codbi-elem-badge--funcs>.codbi-func-list>.codbi-holistic-item{opacity:1}
/* "Detailed" mode: reveal the functionality list without hovering (the parameter table stays
   hover-only, since no --open rule targets it). */
.codbi-elem-badge--open .codbi-func-list{max-width:2000px;overflow:visible;opacity:1;padding:0 6px 0 2px;pointer-events:auto}
.codbi-elem-badge--open .codbi-func-list>.codbi-func-item{opacity:1}
.codbi-elem-badge--open .codbi-func-list>.codbi-css-item{opacity:1}
.codbi-elem-badge--open .codbi-func-list>.codbi-holistic-item{opacity:1}
/* While any control inside the badge (the "+ Add" select or a value input) holds focus the whole
   functionality list stays expanded even if the pointer is no longer over the widget — a native
   select dropdown can move the cursor away, which would otherwise collapse the badge. */
.codbi-elem-badge--focus-active .codbi-func-list{max-width:2000px;overflow:visible;opacity:1;padding:0 6px 0 2px;pointer-events:auto}
.codbi-elem-badge--focus-active .codbi-func-list>.codbi-func-item{opacity:1}
.codbi-elem-badge--focus-active .codbi-func-list>.codbi-css-item{opacity:1}
.codbi-elem-badge--focus-active .codbi-func-list>.codbi-holistic-item{opacity:1}
.codbi-func-item__name{pointer-events:none}
.codbi-css-item__name{pointer-events:none}
.codbi-holistic-item__name{pointer-events:none}
.codbi-func-item__params{position:absolute;top:100%;left:-1px;margin-top:3px;z-index:6;width:max-content;max-width:var(--codbi-func-anchor-width,320px);box-sizing:border-box;padding:0 6px;border:1px solid #c96a00;border-radius:4px;background:rgba(255,255,255,.98);box-shadow:0 2px 6px rgba(15,23,42,.3);color:#374151;visibility:hidden;opacity:0;max-height:0;overflow:hidden;transform:translateY(-4px);transition:max-height .25s ease,opacity .25s ease,transform .25s ease,padding .25s ease,visibility .25s}
.codbi-func-item:hover>.codbi-func-item__params{visibility:visible;opacity:1;max-height:520px;padding:4px 6px;transform:translateY(0)}
/* The CSS-standard-configuration sub-badges (blue) reveal their accumulated parameter table the same
   way the orange functionality badges do. */
.codbi-css-item:hover>.codbi-func-item__params{visibility:visible;opacity:1;max-height:520px;padding:4px 6px;transform:translateY(0)}
/* The HOLISTIC sub-badges (green) reveal their applied-FUNC parameter table the same way. */
.codbi-holistic-item:hover>.codbi-func-item__params{visibility:visible;opacity:1;max-height:520px;padding:4px 6px;transform:translateY(0)}
/* A sub-badge can also be held "open" by JS (class .codbi-func-item--open / .codbi-css-item--open /
   .codbi-holistic-item--open). This keeps the parameter popup visible while a control inside it
   (select, value input) holds focus, so interacting with the "+ Add" dropdown or typing into a value
   does NOT collapse the popup even when the pointer momentarily leaves the sub-badge. */
.codbi-func-item--open>.codbi-func-item__params,
.codbi-css-item--open>.codbi-func-item__params,
.codbi-holistic-item--open>.codbi-func-item__params{visibility:visible;opacity:1;max-height:520px;padding:4px 6px;transform:translateY(0)}
.codbi-css-item>.codbi-func-item__params{border-color:#93c5fd}
.codbi-holistic-item>.codbi-func-item__params{border-color:#6ee7b7}
.codbi-func-table{width:max-content;max-width:100%;border-collapse:collapse;font-size:10.5px;line-height:1.3}
.codbi-func-table th,.codbi-func-table td{border:1px solid #e7c9a3;padding:1px 5px;text-align:left;vertical-align:top}
.codbi-func-table thead th{background:#fde7cf;color:#7c2d12;font-weight:600;white-space:nowrap}
.codbi-func-table tbody th{color:#7c2d12;font-weight:600;white-space:nowrap}
.codbi-func-table--css th,.codbi-func-table--css td{border-color:#bfdbfe}
.codbi-func-table--css thead th{background:#dbeafe;color:#1e40af}
.codbi-func-table--css tbody th{color:#1e40af}
.codbi-func-table--css .codbi-func-input:focus{border-color:#2563eb}
/* GREEN: the parameter table on a HOLISTIC sub-badge (green styling mirrors the blue --css variant). */
.codbi-func-table--holistic th,.codbi-func-table--holistic td{border-color:#a7f3d0}
.codbi-func-table--holistic thead th{background:#d1fae5;color:#14532d}
.codbi-func-table--holistic tbody th{color:#14532d}
.codbi-func-table--holistic .codbi-func-input:focus{border-color:#16a34a}
.codbi-func-section-title th{background:#f5f5f5;color:#4b5563;font-weight:700;font-size:10px;letter-spacing:.3px}
.codbi-func-table--css .codbi-func-section-title th{background:#eff6ff;color:#1e40af}
.codbi-func-table--holistic .codbi-func-section-title th{background:#ecfdf5;color:#14532d}
.codbi-func-addrow th{color:#6b7280;font-weight:500;white-space:nowrap}
.codbi-func-addtrigger{display:inline-flex;align-items:center;gap:4px;box-sizing:border-box;max-width:100%;border:1px solid #d1d5db;border-radius:3px;background:#fff;padding:1px 4px;margin:0;font:inherit;font-size:10.5px;line-height:1.2;color:#1f2937;cursor:pointer;pointer-events:auto;white-space:nowrap}
.codbi-func-addtrigger::after{content:"▾";font-size:9px;color:#9ca3af}
.codbi-func-addtrigger:hover{border-color:#c96a00;background:#fef3e2}
.codbi-func-addtrigger--open{border-color:#c96a00;background:#fde7cf}
.codbi-func-table--css .codbi-func-addtrigger:hover{border-color:#2563eb;background:#eff6ff}
.codbi-func-table--css .codbi-func-addtrigger--open{border-color:#2563eb;background:#dbeafe}
.codbi-func-table--holistic .codbi-func-addtrigger:hover{border-color:#16a34a;background:#ecfdf5}
.codbi-func-table--holistic .codbi-func-addtrigger--open{border-color:#16a34a;background:#d1fae5}
/* The available parameters revealed when the trigger is opened — inline option rows so they are not
   clipped by the popup's overflow:hidden. They replace the native <select> (which pushed focus and the
   pointer outside the badge and collapsed the hover-driven popup). */
.codbi-func-addoption td{color:#2563eb;font-weight:500;white-space:nowrap;cursor:pointer;border-top:0}
.codbi-func-addoption:hover td{background:#eff6ff;text-decoration:underline}
.codbi-func-table--css .codbi-func-addoption td{color:#1e40af}
.codbi-func-table--css .codbi-func-addoption:hover td{background:#dbeafe}
.codbi-func-table--holistic .codbi-func-addoption td{color:#15803d}
.codbi-func-table--holistic .codbi-func-addoption:hover td{background:#d1fae5}
.codbi-func-input{min-width:0;max-width:100%;box-sizing:border-box;border:1px solid transparent;border-radius:3px;background:transparent;padding:0 3px;margin:0;font:inherit;color:#1f2937;pointer-events:auto}
.codbi-func-input:focus{outline:none;border-color:#c96a00;background:#fff}
.codbi-func-bool{flex:0 0 auto;vertical-align:middle;cursor:pointer}
.codbi-func-input--enum{min-height:16px;cursor:pointer;background:#fff;border-color:#e7c9a3;padding:0 2px}
.codbi-func-actions{width:1%;white-space:nowrap;text-align:center}
.codbi-func-delete{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;margin:0;border:0;border-radius:3px;background:transparent;color:#b91c1c;cursor:pointer;pointer-events:auto}
.codbi-func-delete:hover{background:#fee2e2}
.codbi-func-delete svg{display:block;width:12px;height:12px}
.codbi-func-ep{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;margin:0 0 0 2px;border:1px solid #c96a00;border-radius:3px;background:transparent;color:#c96a00;font-size:12px;font-weight:700;line-height:1;cursor:pointer;pointer-events:auto}
.codbi-func-ep:hover{background:#fff7ed}
.codbi-func-value{display:inline-flex;align-items:center;gap:2px;max-width:100%}
.codbi-func-maximize{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;padding:0;margin:0;border:0;border-radius:3px;background:transparent;color:#2563eb;cursor:pointer;pointer-events:auto}
.codbi-func-maximize:hover{background:#dbeafe}
.codbi-func-maximize svg{display:block;width:12px;height:12px}
.codbi-func-item__params--max{min-height:40px;max-height:70vh}
.codbi-func-item__params--max .codbi-func-table{width:100%}
.codbi-func-item__params--max .codbi-func-value{width:100%}
.codbi-func-item__params--max .codbi-func-input{flex:1 1 auto;width:auto;min-width:0}
.codbi-func-preview-switch{position:absolute;top:4px;right:4px;z-index:30;display:inline-flex;align-items:center;gap:5px;box-sizing:border-box;background:rgba(255,255,255,.94);border:1px solid darkorange;border-radius:999px;box-shadow:0 1px 3px rgba(15,23,42,.28);padding:3px 7px;cursor:pointer;pointer-events:none;opacity:0;visibility:hidden;transition:opacity .15s ease,visibility .15s ease;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:11px;line-height:1;color:#374151;user-select:none}
/* The preview switch is hidden by default so it does not clutter every form element. It appears only
   while its element (the anchor cell that directly owns it) is hovered, while it is switched ON, or
   when it holds keyboard focus — the latter two keep it clickable to turn a running preview off. */
*:hover>.codbi-func-preview-switch,
.codbi-func-preview-switch--on,
.codbi-func-preview-switch:focus-visible{opacity:1;visibility:visible;pointer-events:auto}
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

/** The type of a functionality parameter (mirrors `codbi-common`'s `TParameterType`). */
type TParamType = "string" | "integer" | "number" | "boolean" | "enum";

/** The designer-side view of ONE functionality parameter's type metadata. */
interface IParamSpec {
  /** The parameter's type. Absent/unknown means `"string"`. */
  type?: TParamType;
  /** For `type: "enum"`: the allowed, fixed set of values. */
  options?: string[];
  /** The parameter's default value (as a string). */
  default?: string;
  /** A short description of the parameter (the base/English locale). */
  description?: string;
  /** The parameter's description in German (`de`). */
  descriptionDe?: string;
  /** The parameter's description in Italian (`it`). */
  descriptionIt?: string;
}

/** Structural view of one CodBi functionality definition (`window.CodbiPluginData.detFunctionalities`). */
interface IFunctionalityDef {
  Description?: string;
  Parameter?: Record<string, string>;
  /** Per-parameter type metadata (`@ParameterTypes`, published by the build-time generator). */
  parameters?: Record<string, IParamSpec>;
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
 * The parameter name most recently added via a badge's "+ Add" dropdown. Survives the badge
 * re-renders that `refreshBadges` performs, so {@link ensureFuncBadge} can move focus back into the
 * freshly-built value input (and thus re-expand the popup via the focus listeners) right after the
 * mousedown-driven re-render would otherwise leave the badge collapsed at icon size.
 */
let pendingAddedParam: string | null = null;

/**
 * The label (functionality name or CSS standard-configuration class) of the sub-badge whose
 * parameter popup is currently being used. The badge is rebuilt (via `replaceChildren`) after almost
 * every parameter change, and a rebuild starts with the popup collapsed at icon size. Remembering the
 * open sub-badge lets {@link ensureFuncBadge} re-expand exactly the sub-badge the user is working on
 * after every rebuild, so the table never "vanishes" while editing.
 */
let openFuncSubBadge: string | null = null;

/**
 * After a badge rebuild, refocus the input of the parameter that was just added through the "+ Add"
 * dropdown and keep the popup expanded. Moving focus into the input fires the badge/sub-badge
 * `focusin` listeners, which add the `codbi-elem-badge--focus-active` / `--open` classes and thereby
 * keep the table open even though the pointer is no longer over the badge.
 */
function restorePendingParamFocus(badge: HTMLElement): void {
  if (!pendingAddedParam) {
    return;
  }
  const name = pendingAddedParam;
  try {
    const input = badge.querySelector<HTMLInputElement>(`tr[data-param="${CSS.escape(name)}"] input.codbi-func-input`);
    if (input) {
      input.focus();
      input.select();
      // Belt-and-suspenders: make sure the param table is guaranteed to be revealed. The focus above
      // normally bubbles up to the item's `focusin` listener (which adds `codbi-func-item--open` /
      // `codbi-css-item--open`) and the badge's `focusin` listener (which adds
      // `codbi-elem-badge--focus-active`). Add those classes directly as well so the popup cannot be
      // left collapsed at icon size even if the focus event never reaches a listener after a rebuild.
      const params = input.closest<HTMLElement>(".codbi-func-item__params");
      if (params) {
        const item = params.parentElement;
        if (item) {
          if (item.classList.contains("codbi-css-item")) {
            item.classList.add("codbi-css-item--open");
          } else {
            item.classList.add("codbi-func-item--open");
          }
          // Remember WHICH sub-badge is open so that ANY later rebuild (e.g. adding a second parameter
          // to the same sub-badge) re-expands the correct table instead of collapsing to icon size.
          const subKey = item.dataset.cbSub;
          if (subKey) {
            openFuncSubBadge = subKey;
          }
        }
      }
      badge.classList.add("codbi-elem-badge--focus-active");
    }
  } catch {
    /* the row may not have been rendered — clear the hint below */
  }
  // Clear the hint shortly after so a later refresh no longer keeps stealing focus to this row.
  window.setTimeout(() => {
    if (pendingAddedParam === name) {
      pendingAddedParam = null;
    }
  }, 500);
}

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
 * Mutates the item's writable property bags so one `data-cb-*` attribute is set/updated, and nudges
 * the persist differ so the change is picked up as a form edit. This is the light half of a write:
 * it does NOT force the designer's AttributesEditor to re-valuate, which is the heavy operation that
 * makes per-keystroke edits on the SELECTED item slow (see {@link setFuncAttribute}).
 *
 * @returns **True** when the attribute was written into at least one bag.
 */
function writeAttrBags(item: IMarkerItemLike, name: string, value: string): boolean {
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
  return true;
}

/**
 * Sets or updates one `data-cb-*` attribute on the item's property bag (the same bag the designer's
 * AttributesEditor reads/writes) so the change is reflected in the element's config attribute table,
 * and syncs the open AttributesEditor for the selected item.
 */
function setFuncAttribute(item: IMarkerItemLike, name: string, value: string): boolean {
  const ok = writeAttrBags(item, name, value);
  if (ok) {
    syncAttributesEditor(item);
  }
  return ok;
}

/**
 * Like {@link setItemAttributeValue}, but WITHOUT forcing the open AttributesEditor to re-valuate. It
 * writes the attribute directly into the item's property bags and nudges the persist differ, which is
 * all the CodBi config panel needs — it re-renders its own controls and persists through the bags, so
 * the expensive attributes-grid re-valuation only slows the SELECTED item down (the very lag the badge
 * tables avoid). The attribute still appears in the attributes grid when it is (re)opened.
 *
 * @param item  The target item.
 * @param name  The attribute name (e.g. `data-cb-reverse`).
 * @param value The new attribute value.
 *
 * @returns **True** when the attribute was written. */
export function setItemAttributeValueQuiet(item: IMarkerItemLike, name: string, value: string): boolean {
  return writeAttrBags(item, name, value);
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
 * persist differ. This is the light half of a remove: it does NOT force the designer's
 * AttributesEditor to re-valuate, which is the heavy operation that makes edits on the SELECTED item
 * slow (see {@link removeFuncAttribute}).
 *
 * The parameter may be handed to us with or without the `data-cb-` prefix (the stored attribute can
 * use either convention depending on how it was written), so we match on BOTH the raw name and its
 * prefixed/unprefixed counterpart. Otherwise a name mismatch would silently leave the attribute in
 * the bag while still reporting success — exactly the "remove icon does nothing" symptom.
 *
 * @returns **True** when the attribute was removed from at least one bag.
 */
function removeAttrBags(item: IMarkerItemLike, name: string): boolean {
  const bags = writablePropertyBags(item);
  if (bags.length === 0) {
    return false;
  }
  // Cover both storage conventions: the attribute may exist as `Unit` (bare) while the badge hands us
  // `data-cb-Unit` (prefixed) or vice-versa, so we remove whichever variant is actually stored.
  const prefixed = name.toLowerCase().startsWith(CB_PARAM_PREFIX) ? name : `${CB_PARAM_PREFIX}${name}`;
  const bare = name.toLowerCase().startsWith(CB_PARAM_PREFIX) ? name.slice(CB_PARAM_PREFIX.length) : name;
  const candidates = new Set<string>([prefixed.toLowerCase(), bare.toLowerCase()]);
  for (const props of bags) {
    const attrs: IAttributeEntry[] = (
      Array.isArray(props.attributes) ? (props.attributes as IAttributeEntry[]) : []
    ).filter((a) => {
      const text = String(a?.text ?? "")
        .trim()
        .toLowerCase();
      return !candidates.has(text);
    });
    props.attributes = attrs;
  }
  notifyAttributeChange();
  return true;
}

/**
 * Removes one `data-cb-*` attribute (name and value) from the item's property bags, nudges the
 * persist differ, and syncs the open AttributesEditor for the selected item.
 *
 * Exported so the per-element CodBi config editor can drop a functionality's parameters when that
 * functionality is removed.
 */
export function removeFuncAttribute(item: IMarkerItemLike, name: string): boolean {
  const ok = removeAttrBags(item, name);
  if (ok) {
    syncAttributesEditor(item);
  }
  return ok;
}

/**
 * Like {@link removeFuncAttribute}, but WITHOUT forcing the open AttributesEditor to re-valuate. It
 * removes the attribute directly from the item's property bags and nudges the persist differ, which
 * is all the CodBi config panel needs — the expensive attributes-grid re-valuation only slows the
 * SELECTED item down (the very lag the badge tables avoid).
 *
 * @param item The target item.
 * @param name The attribute name (e.g. `data-cb-reverse`).
 *
 * @returns **True** when the attribute was removed. */
export function removeFuncAttributeQuiet(item: IMarkerItemLike, name: string): boolean {
  return removeAttrBags(item, name);
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

/** Structural view of one CodBi standard-configuration (the JSON descriptor's shape). */
interface IStandardConfigDef {
  Description?: string;
  Active?: boolean;
  classes?: Record<string, string>;
  globals?: Record<string, string>;
  /** Maps each CSS-Class (that is a `loadConfig` target) to the comma-separated `FUNC` list. */
  funcs?: Record<string, string>;
  /**
   * The real CSS selector the holistic configuration resolves against at form runtime
   * (`window.codbi.loadConfig({ targets, FUNC })`). Multiple selectors are separated by `~`
   * (matching the runtime split in `global-scope.ts`). Only present on `Holistic.*` descriptors.
   */
  targets?: string;
  /**
   * The single functionality (`FUNC`) a holistic configuration applies to every element its
   * `targets` selector resolves to. Its parameter table is shown in the green sub-badge.
   */
  func?: string;
}

/** @returns the CodBi standard-configuration data injected by the designer resource plugin. */
function standardsData(): Record<string, IStandardConfigDef> | undefined {
  try {
    const data = (window as unknown as { CodbiPluginData?: { detStandards?: Record<string, unknown> } })
      .CodbiPluginData;
    return data?.detStandards as Record<string, IStandardConfigDef> | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Collects every CSS class name that the CodBi standard configurations provide
 * (`window.CodbiPluginData.detStandards[*].classes`). These are the class names the element CSS-class
 * property is checked against.
 */
function standardClassNames(): Set<string> {
  const names = new Set<string>();
  const standards = standardsData();
  for (const standardKey of Object.keys(standards ?? {})) {
    const standard = standards?.[standardKey];
    if (!standard?.classes) {
      continue;
    }
    for (const cssClass of Object.keys(standard.classes)) {
      names.add(cssClass);
    }
  }
  return names;
}

/**
 * Reads the element's `cssclasses` property (an array of class names) and returns the subset that are
 * recognized CodBi standard-configuration classes. Handles an array or a whitespace/comma separated
 * string defensively.
 */
function existingCssClasses(item: IMarkerItemLike): string[] {
  const props = propertiesOf(item);
  const raw = props?.[CSS_CLASSES_PROPERTY];
  const parts = Array.isArray(raw)
    ? raw.map((c) => String(c))
    : String(raw ?? "")
        .split(/[\s,]+/)
        .map((c) => c.trim());
  const recognized = standardClassNames();
  const result: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const name = part.trim();
    if (!name || seen.has(name) || !recognized.has(name)) {
      continue;
    }
    seen.add(name);
    result.push(name);
  }
  return result;
}

/** @returns `true` when the item carries at least one recognized CodBi standard-configuration class. */
function hasCssClasses(item: IMarkerItemLike): boolean {
  return existingCssClasses(item).length > 0;
}

/**
 * One group of parameter rows inside a parameter table (see {@link buildParamTable}). A group lists the
 * parameters of ONE functionality — the bare functionality badge holds a single group; a CSS-standard-
 * configuration badge accumulates one group per functionality mentioned in its `FUNC` list.
 */
interface IParamTableSection {
  /** Optional human-readable header shown above the group (mainly the functionality name). */
  title?: string;
  /** The parameters already set on the element (name = full `data-cb-*` attribute, value). */
  params: Array<{ name: string; value: string }>;
  /** The full list of available parameter attribute names (`data-cb-xyz`) for this functionality. */
  available: string[];
  /** The functionality key whose type metadata (`parameters`) this group's params belong to. */
  funcKey?: string;
}

/**
 * Returns the functionality names (`FUNC`s) applied to an element that carries the CSS standard-
 * configuration class `cssClass`, derived from the enriched `detStandards[*].funcs` map.
 */
function funcNamesForCssClass(cssClass: string): string[] {
  const result: string[] = [];
  const standards = standardsData();
  for (const standardKey of Object.keys(standards ?? {})) {
    const funcsCsv = standards?.[standardKey]?.funcs?.[cssClass];
    if (!funcsCsv) {
      continue;
    }
    for (const part of funcsCsv.split(",")) {
      const name = part.trim();
      if (name && !result.includes(name.toLowerCase())) {
        result.push(name);
      }
    }
  }
  return result;
}

/** One active holistic standard-configuration that targets per-element widgets in the form. */
interface IActiveHolisticConfig {
  /** The standard-configuration id, e.g. `"Holistic.Media.Input.Speech"`. */
  id: string;
  /** The descriptor (`detStandards[id]`). */
  def: IStandardConfigDef;
}

/** Selectors a holistic configuration resolves against that are GLOBAL and never per-element widgets. */
const GLOBAL_HOLISTIC_TARGETS = new Set(["head", "body", "html", "form", "body > *"]);

/** Prefix that marks a standard-configuration id as a holistic (runtime-selector-resolved) config. */
const HOLISTIC_STANDARD_PREFIX = "Holistic.";

/**
 * The currently-ACTIVE holistic standard-configurations (`detStandards[*].Active === true` whose id
 * starts with `Holistic.` and that carry a real `targets` selector resolving to per-element widgets).
 * Global-target configs (`Holistic.CSS.Standard` → `head`, `Holistic.Matomo.Tracking` → `body`) are
 * excluded because they apply form-wide and must not produce a badge on any single element.
 */
function activeHolisticConfigs(): IActiveHolisticConfig[] {
  const standards = standardsData();
  if (!standards) {
    return [];
  }
  const holisticIds = Object.keys(standards).filter((id) => id.startsWith(HOLISTIC_STANDARD_PREFIX));
  const result: IActiveHolisticConfig[] = [];
  for (const id of holisticIds) {
    const def = standards[id];
    const active = Boolean(def?.Active);
    const hasTargets = Boolean(def?.targets);
    const skippedGlobal = hasTargets && GLOBAL_HOLISTIC_TARGETS.has((def?.targets ?? "").trim());
    if (!active || !hasTargets || skippedGlobal) {
      continue;
    }
    result.push({ id, def: def as IStandardConfigDef });
  }
  return result;
}

/**
 * Determines whether an element (its DOM anchor) is targeted by a holistic configuration's
 * `targets` selector. Mirrors the form runtime: the selector is split on `~` and each part is tested
 * with `Element.matches` (which natively handles comma-separated selectors inside one part). Returns
 * `false` on any selector error rather than throwing into the badge pipeline.
 *
 * The anchor in the designer is the item's CONTENT CELL (a `<td class="xm-item-content">` wrapper),
 * NOT the inner form `<input>`/`<fieldset>` the runtime selectors actually target. So besides testing
 * the anchor itself we also test the form controls nested inside it (via a descendant `querySelector`),
 * which is what makes selectors like `input[data-datepicker="1"]`, `input[data-vdt="time"]`,
 * `input[type="text"]` and `fieldset:...` resolve against the real widget even when the anchor is the
 * wrapper `<td>`.
 */
function holisticTargetsAnchor(anchor: HTMLElement, targets: string): boolean {
  if (!anchor || !targets) {
    return false;
  }
  // The candidate elements to test: the anchor itself plus the form control(s) nested inside it.
  // A `querySelector` (first match) is sufficient — the runtime targets one concrete control and the
  // badge is bound to the owning wrapper, so a single control match grants the badge to the wrapper.
  const candidates: HTMLElement[] = [anchor];
  try {
    const inner = anchor.querySelector(
      "input[type], textarea, select, fieldset, input, [role='presentation'] input, .xm-item-div input, .xm-item-div fieldset",
    );
    if (inner instanceof HTMLElement && !candidates.includes(inner)) {
      candidates.push(inner);
    }
  } catch {
    /* ignore invalid descendant selector */
  }
  for (const part of targets.split("~")) {
    const selector = part.trim();
    if (!selector) {
      continue;
    }
    try {
      for (const candidate of candidates) {
        if (candidate.matches(selector)) {
          return true;
        }
      }
    } catch {
      /* invalid selector — ignore this part */
    }
  }
  return false;
}

/**
 * The active holistic configurations that hit the given element (by matching its DOM anchor against
 * each config's `targets` selector). Used to decide whether an element earns a GREEN holistic
 * sub-badge and which ones to render.
 */
function holisticConfigsFor(anchor: HTMLElement | null): IActiveHolisticConfig[] {
  if (!anchor) {
    return [];
  }
  const actives = activeHolisticConfigs();
  const matched: IActiveHolisticConfig[] = [];
  for (const config of actives) {
    let matchResult = false;
    try {
      matchResult = holisticTargetsAnchor(anchor, config.def.targets ?? "");
    } catch {
      matchResult = false;
    }
    if (matchResult) {
      matched.push(config);
    }
  }
  return matched;
}

/** The ids of the active holistic configurations that hit `anchor` (for badge change-signatures). */
function holisticConfigIdsFor(anchor: HTMLElement | null): string[] {
  return holisticConfigsFor(anchor).map((config) => config.id);
}

/**
 * The parameter-table groups for one holistic configuration's applied `FUNC`. Exactly like a CSS-class
 * group, each group lists the functionality's available parameter attributes and the ones the element
 * has already set, so the config's parameter space is editable from the green sub-badge.
 */
function buildHolisticSections(id: string, def: IStandardConfigDef, item: IMarkerItemLike): IParamTableSection[] {
  const funcName = (def.func ?? "").trim();
  if (!funcName) {
    return [];
  }
  const available = availableParameterNames(funcName);
  const entries = attributeEntries(item);
  const params: Array<{ name: string; value: string }> = [];
  for (const attrName of available) {
    const present = attributeEntriesContain(entries, attrName);
    const value = currentParamValue(item, attrName);
    if (present || value !== "") {
      params.push({ name: attrName, value });
    }
  }
  return [{ title: `${id} · ${funcName}`, params, available, funcKey: funcName }];
}

/**
 * The available parameter ATTRIBUTE names (`data-cb-<param>`) of one functionality, taken from the
 * reliability source `detFunctionalities[*].Parameter`. Used to populate the "add parameter" dropdown.
 */
function availableParameterNames(funcName: string): string[] {
  const data = functionalityData();
  const def = data?.[funcName.toLowerCase()];
  if (!def?.Parameter) {
    return [];
  }
  return Object.keys(def.Parameter).map((key) => `${CB_PARAM_PREFIX}${key}`);
}

/** Strip the `data-cb-` prefix so a parameter attribute shows without a redundant `data-cb-` label. */
function paramLabel(attrName: string): string {
  return attrName.toLowerCase().startsWith(CB_PARAM_PREFIX) ? attrName.slice(CB_PARAM_PREFIX.length) : attrName;
}

/**
 * Resolves the published type metadata (`detFunctionalities[*].parameters`) of one parameter, matched
 * case-insensitively by its bare name (without the `data-cb-` prefix). Returns `undefined` when the
 * functionality declares no type, in which case the caller falls back to a plain text input.
 */
/** Parses the legacy `{Type}` hint out of a parameter description (the older manager shape). */
function parameterSpecFromDescription(description: string | undefined): IParamSpec | undefined {
  const hint = /\{\s*([A-Za-z]+)\s*\}/.exec(String(description ?? ""))?.[1]?.toLowerCase();
  if (hint === "boolean" || hint === "integer" || hint === "number") {
    return { type: hint };
  }
  return undefined;
}

function parameterSpecFor(funcKey: string | undefined, attrName: string): IParamSpec | undefined {
  if (!funcKey) {
    return undefined;
  }
  const data = functionalityData();
  if (!data) {
    return undefined;
  }
  // Case-insensitive entry resolution (the registry keys may use the original casing).
  const wanted = funcKey.toLowerCase();
  let entry: IFunctionalityDef | undefined;
  for (const key of Object.keys(data)) {
    if (key.toLowerCase() === wanted) {
      entry = data[key];
      break;
    }
  }
  if (!entry) {
    return undefined;
  }
  const bare = paramLabel(attrName).toLowerCase();
  // Prefer the structured `parameters` TYPE map.
  const params = entry.parameters;
  if (params) {
    for (const key of Object.keys(params)) {
      if (key.toLowerCase() === bare) {
        return params[key];
      }
    }
  }
  // Fallback: the legacy `{Type}` hint carried in the parameter description (used by the config
  // editors), so the badge stays consistent even when the structured `parameters` map is absent.
  const descriptions = entry.Parameter;
  if (descriptions) {
    for (const key of Object.keys(descriptions)) {
      if (key.toLowerCase() === bare) {
        return parameterSpecFromDescription(descriptions[key]);
      }
    }
  }
  return undefined;
}

/** @returns whether a persisted `data-cb-*` value counts as a checked boolean (`true`/`1`/`yes`/`on`). */
function isTruthyParam(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

/** Reads the value of a `data-cb-*` parameter attribute from the current item ("" when unset). */
function currentParamValue(item: IMarkerItemLike, attrName: string): string {
  return attributeValue(attributeEntries(item), attrName);
}

/**
 * The parameter-table groups for a CSS standard-configuration class: one group per functionality in
 * the class's `FUNC` list (see {@link funcNamesForCssClass }). Each group lists that functionality's
 * available parameter names and the ones the element already set, so the whole class's possible
 * parameter space (unioned across its functionalities) is editable from the single blue badge.
 *
 * A parameter counts as "present" when its attribute already exists on the element's bag — a value row
 * is rendered even when the value is still empty. This is essential after the "+ Add" dropdown sets a
 * fresh parameter to `""`: the row must stay on screen (with its value input) so the user can type the
 * value, instead of vanishing the moment the badge is rebuilt.
 */
function buildCssClassSections(cssClass: string, item: IMarkerItemLike): IParamTableSection[] {
  const funcNames = funcNamesForCssClass(cssClass);
  const entries = attributeEntries(item);
  return funcNames.map((funcName) => {
    const available = availableParameterNames(funcName);
    const params: Array<{ name: string; value: string }> = [];
    for (const attrName of available) {
      // "Present" means the attribute exists in the bag, REGARDLESS of its (possibly empty) value.
      const present = attributeEntriesContain(entries, attrName);
      const value = currentParamValue(item, attrName);
      if (present || value !== "") {
        params.push({ name: attrName, value });
      }
    }
    return { title: funcName, params, available, funcKey: funcName };
  });
}

/** @returns `true` when the item's attribute bag carries an attribute whose name equals `attrName`. */
function attributeEntriesContain(entries: IAttributeEntry[], attrName: string): boolean {
  const wanted = attrName.toLowerCase();
  for (const attr of entries) {
    if (
      String(attr?.text ?? "")
        .trim()
        .toLowerCase() === wanted
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Flattens the `data-cb-*` parameter attributes the element has SET for the given CSS classes into a
 * stable signature fragment, so re-rendering (e.g. after adding a parameter to a blue badge) reflects
 * the new attributes without relying on the transient DOM state.
 */
function cssClassesParamSignature(cssClasses: string[], item: IMarkerItemLike): string {
  // Deterministically collect the union of every functionality's available params (with their current
  // values, empty when unset) so ANY change re-renders the badge, independent of attribute-bag order.
  const attrs = attributeEntries(item);
  const valueFor = (attrName: string): string => {
    const key = attrName.toLowerCase();
    for (const attr of attrs) {
      if (
        String(attr?.text ?? "")
          .trim()
          .toLowerCase() === key
      ) {
        return String(attr?.value ?? "").trim();
      }
    }
    return "";
  };
  const all = new Map<string, string>();
  for (const cssClass of cssClasses) {
    for (const funcName of funcNamesForCssClass(cssClass)) {
      for (const attrName of availableParameterNames(funcName)) {
        const key = attrName.toLowerCase();
        if (!all.has(key)) {
          all.set(key, valueFor(attrName));
        }
      }
    }
  }
  const parts: string[] = [];
  for (const key of Array.from(all.keys()).sort()) {
    parts.push(`${key}\u0003${all.get(key) ?? ""}`);
  }
  return parts.join("\u0002");
}

/**
 * Flattens the `data-cb-*` parameter attributes the element has SET for the given holistic configs'
 * applied `FUNC`s into a stable signature fragment, so re-rendering (e.g. after adding a parameter to
 * a GREEN holistic sub-badge) reflects the new attributes without relying on the transient DOM state.
 * This mirrors {@link cssClassesParamSignature} for the holistic configs' `func`.
 */
function holisticParamsSignature(configs: IActiveHolisticConfig[], item: IMarkerItemLike): string {
  if (configs.length === 0) {
    return "";
  }
  const attrs = attributeEntries(item);
  const valueFor = (attrName: string): string => {
    const key = attrName.toLowerCase();
    for (const attr of attrs) {
      if (
        String(attr?.text ?? "")
          .trim()
          .toLowerCase() === key
      ) {
        return String(attr?.value ?? "").trim();
      }
    }
    return "";
  };
  const all = new Map<string, string>();
  for (const config of configs) {
    const funcName = (config.def.func ?? "").trim();
    if (!funcName) {
      continue;
    }
    for (const attrName of availableParameterNames(funcName)) {
      const key = attrName.toLowerCase();
      if (!all.has(key)) {
        all.set(key, valueFor(attrName));
      }
    }
  }
  const parts: string[] = [];
  for (const key of Array.from(all.keys()).sort()) {
    parts.push(`${key}\u0003${all.get(key) ?? ""}`);
  }
  return parts.join("\u0002");
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
    // The platform preview's floating speed-dial menu (the round "⋯" launcher + its pop-up menu).
    // It is fixed/overlaid, so the sibling-hiding in `clipPreviewToElement` never removes it and it
    // would otherwise float on top of / beside the clipped element.
    ".ui-speeddial",
    ".xm-form-preview__speed-dial",
    '[class*="speeddial"]',
    '[class*="speed-dial"]',
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
    // Remove the platform preview chrome up front — the preview-tools dial AND the floating speed-dial
    // menu — so they never render inside the clipped element preview.
    hidePreviewChrome(cdoc);
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
    badge.className = `${BADGE_CLASS} codbi-elem-badge--bottom`;
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
function funcSignature(funcs: IFunctionalityEntry[], cssClasses: string[], item: IMarkerItemLike): string {
  const funcsPart = funcs
    .map((fn) => `${fn.name}\u0002${fn.params.map((p) => `${p.name}\u0003${p.value}`).join("\u0002")}`)
    .join("\u0001");
  const cssPart = cssClasses.join("\u0004");
  // Fold in the `data-cb-*` parameters the element has set for the CSS-class FUNCs, so adding/editing a
  // parameter via a BLUE badge re-renders the badge (the funcsPart above only covers `data-cb-func`).
  const cssParamsPart = cssClassesParamSignature(cssClasses, item);
  return `${funcsPart}\u0005${cssPart}\u0005${cssParamsPart}`;
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
 * Builds the parameter/value table shown inside a badge's hover popup. The table is composed of one
 * or more {@link IParamTableSection } groups — a bare functionality badge passes a single group for
 * its own parameters, while a CSS-standard-configuration badge passes one group per functionality
 * named in the class's `FUNC` list (so all of that class's possible parameters show up together).
 *
 * Every row holds the (fixed) parameter name, an EDITABLE value input and a trash button that removes
 * the parameter; every change is written straight into the item's property bag, so it shows up in the
 * element's config attribute table. At the end of each group an "add parameter" `<select>` lists the
 * functionality's available parameters that are NOT yet set — choosing one adds it (empty value) and
 * re-renders the badge.
 *
 * Pressing **ALT+E** on a value input opens the {@link openEPBuilder } popup so Element Placeholders
 * can be composed and nested; applying writes the serialized value back through the same path as a
 * manual edit.
 *
 * @param variant Which styling variant the table uses: `"func"` (orange), `"css"` (blue) or
 *   `"holistic"` (green, the runtime-selector-resolved standard configurations).
 */
function buildParamTable(
  doc: Document,
  sections: IParamTableSection[],
  resolve: () => IMarkerItemLike,
  anchor: HTMLElement,
  subBadge: HTMLElement,
  popup: HTMLElement,
  variant: "func" | "css" | "holistic" = "func",
  badge?: HTMLDivElement,
): HTMLTableElement {
  const table = doc.createElement("table");
  table.className =
    variant === "css"
      ? "codbi-func-table codbi-func-table--css"
      : variant === "holistic"
        ? "codbi-func-table codbi-func-table--holistic"
        : "codbi-func-table";
  const head = doc.createElement("thead");
  const headRow = doc.createElement("tr");
  const headName = doc.createElement("th");
  headName.textContent = i18n("designer.marker.table.parameter");
  const headValue = doc.createElement("th");
  headValue.textContent = i18n("designer.marker.table.value");
  const headActions = doc.createElement("th");
  headActions.className = "codbi-func-actions";
  // ONE maximize button for the whole popup, anchored at the table's top-right corner.
  const maximizeButton = doc.createElement("button");
  maximizeButton.type = "button";
  maximizeButton.className = "codbi-func-maximize";
  maximizeButton.title = i18n("designer.marker.table.maximize");
  maximizeButton.setAttribute("aria-label", i18n("designer.marker.table.maximize"));
  maximizeButton.innerHTML = MAXIMIZE_ICON_SVG;
  isolateControl(maximizeButton);
  maximizeButton.addEventListener("click", (event) => {
    event.preventDefault();
    const next = popup.dataset.codbiMax !== "1";
    popup.dataset.codbiMax = next ? "1" : "0";
    applyFuncPopupWidth(subBadge, popup, anchor, next);
  });
  headActions.appendChild(maximizeButton);
  headRow.append(headName, headValue, headActions);
  head.appendChild(headRow);
  table.appendChild(head);

  const addRow = (row: HTMLTableRowElement, section: IParamTableSection): void => {
    const attrName = row.dataset.param ?? "";
    const value = row.dataset.value ?? "";
    const spec = parameterSpecFor(section.funcKey, attrName);
    const type = spec?.type ?? "string";
    // Column 1 — the (fixed) parameter name. Hovering it shows the parameter's description, localized
    // to the current designer language (the structured `parameters[*].description{De,It}` channel,
    // falling back to the legacy `Parameter`-map hint), so the badge exposes the same tooltip as the
    // config panel.
    const name = doc.createElement("th");
    name.scope = "row";
    name.textContent = paramLabel(attrName);
    const paramDescription = localizedParameterDescription(spec);
    if (paramDescription) {
      name.title = paramDescription;
    }
    // Column 2 — the editable value.
    const valueCell = doc.createElement("td");
    const valueWrap = doc.createElement("span");
    valueWrap.className = "codbi-func-value";
    // Opens the EP builder for an attribute value input. Shared by the ALT+E shortcut and the
    // "ƒ" EP-manager button in the actions cell, so both stay in sync. The composed value is
    // written back through the SAME path as a manual edit.
    let openEpFor: (() => void) | undefined;
    // Attaches the ALT+E EP-builder shortcut + Enter-commit behaviour to a text-like control.
    const bindTextShortcuts = (input: HTMLInputElement): void => {
      openEpFor = (): void => {
        openEPBuilder({
          // Render into the DESIGNER document (not the canvas iframe) so the popup snaps to the
          // designer window's edges, exactly like the Form Assistant dialog.
          document: window.document,
          anchor,
          value: input.value,
          listEPs: listElementPlaceholders,
          onApply: (applied) => {
            input.value = applied;
            setFuncAttribute(resolve(), attrName, applied);
            input.blur();
          },
        });
      };
      input.addEventListener("change", () => {
        setFuncAttribute(resolve(), attrName, input.value);
      });
      input.addEventListener("keydown", (event) => {
        // #region Alt+E → open the EP builder for this attribute value.
        if (event.altKey && event.key.toLowerCase() === "e") {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
          openEpFor?.();
          return;
        }
        // #endregion Alt+E → open the EP builder for this attribute value.

        if (event.key === "Enter") {
          event.preventDefault();
          input.blur(); // Commits the value (fires `change`).
        }
      });
    };
    // Render the value control that matches the parameter's published type (see `parameterSpecFor`).
    let control: HTMLElement;
    if (type === "boolean") {
      // A self-drawn toggle — a styled <span>, NOT an <input type="checkbox"> — so the canvas /
      // framework CSS (which resets/paints checkboxes) cannot hide it. The appearance is set as
      // INLINE styles, which win over any stylesheet rule (except `!important`).
      const toggle = doc.createElement("span");
      toggle.className = "codbi-func-bool";
      toggle.setAttribute("role", "checkbox");
      toggle.tabIndex = 0;
      toggle.title = attrName;
      toggle.style.cssText =
        "flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;box-sizing:border-box;border:1px solid #c96a00;border-radius:3px;background:#fff;color:#fff;font-size:11px;font-weight:700;line-height:1;cursor:pointer;user-select:none;vertical-align:middle;";
      const applyState = (on: boolean): void => {
        toggle.setAttribute("aria-checked", on ? "true" : "false");
        toggle.textContent = on ? "\u2713" : "";
        toggle.style.background = on ? "#ff8c00" : "#fff";
        toggle.style.borderColor = on ? "#ff8c00" : "#c96a00";
      };
      applyState(isTruthyParam(value));
      const flip = (): void => {
        const on = toggle.getAttribute("aria-checked") !== "true";
        applyState(on);
        setFuncAttribute(resolve(), attrName, on ? "true" : "false");
      };
      isolateControl(toggle);
      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        flip();
      });
      toggle.addEventListener("keydown", (event) => {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          flip();
        }
      });
      control = toggle;
      // TEMPORARY diagnostic: confirm the toggle is in the document and actually painted.
      queueMicrotask(() => {
        try {
          const view = doc.defaultView;
          const cs = view ? view.getComputedStyle(toggle) : null;
          const rect = toggle.getBoundingClientRect();
          console.info(
            "[CodBi][DBG][bool] attr=%s connected=%s rect=%dx%d display=%s bg=%s border=%s visibility=%s opacity=%s",
            attrName,
            toggle.isConnected,
            rect.width,
            rect.height,
            cs?.display ?? "",
            cs?.backgroundColor ?? "",
            cs?.borderTopColor ?? "",
            cs?.visibility ?? "",
            cs?.opacity ?? "",
          );
        } catch (error) {
          console.warn("[CodBi][DBG][bool] diagnostic failed", error);
        }
      });
    } else if (type === "enum" && spec?.options && spec.options.length > 0) {
      const select = doc.createElement("select");
      select.className = "codbi-func-input codbi-func-input--enum";
      select.title = attrName;
      const blank = doc.createElement("option");
      blank.value = "";
      select.appendChild(blank);
      for (const option of spec.options) {
        const opt = doc.createElement("option");
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
      }
      select.value = value;
      isolateControl(select);
      select.addEventListener("change", () => {
        setFuncAttribute(resolve(), attrName, select.value);
      });
      control = select;
    } else {
      const input = doc.createElement("input");
      input.type = type === "integer" || type === "number" ? "number" : "text";
      if (type === "integer") {
        input.step = "1";
      } else if (type === "number") {
        input.step = "any";
      } else {
        // Let the text input claim enough width for the whole value (a stylesheet width can still cap it).
        input.size = Math.min(Math.max(value.length + 1, 8), 200);
      }
      input.className = "codbi-func-input";
      input.value = value;
      // Hovering the value field also hints at the ALT+E EP-manager shortcut (discoverable next to
      // the "ƒ" button at the right of the row, mirroring the form element's config parameter rows).
      input.title = `${attrName} — ${i18n("designer.marker.table.altE")}`;
      isolateControl(input);
      bindTextShortcuts(input);
      control = input;
    }
    valueWrap.append(control);
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
    // Tab should flow from one parameter value cell to the NEXT value cell, not stop on the row's
    // delete button. Removing it from the tab order (it stays clickable) keeps the value inputs
    // contiguous when tabbing through the table.
    remove.tabIndex = -1;
    isolateControl(remove);
    remove.addEventListener("click", (event) => {
      event.preventDefault();
      const target = resolve();
      if (removeFuncAttribute(target, attrName)) {
        ensureFuncBadge(target, anchor); // Re-render without the removed parameter.
      }
    });
    actionsCell.appendChild(remove);
    // The EP-manager button, right of the trash icon: opens the EP builder for this attribute's
    // value, exactly like the "ƒ" icon next to the form element's config parameter values. Only
    // rows with a text/number value input expose it (boolean toggles and enum selects have no
    // free-text value to compose).
    if (openEpFor) {
      const ep = doc.createElement("button");
      ep.type = "button";
      ep.className = "codbi-func-ep";
      // The tooltip also names the ALT+E shortcut (the same way the value input's own hint does), so
      // hovering the "ƒ" button itself reveals that pressing ALT+E opens the EP manager.
      ep.title = `${i18n("designer.marker.table.ep")} (${i18n("designer.marker.table.altE")})`;
      ep.setAttribute("aria-label", i18n("designer.marker.table.ep"));
      ep.textContent = "ƒ";
      // Skip the "ƒ" launcher in the tab order too, so tabbing from a value field continues to the
      // next value field (the ALT+E shortcut still opens the builder from the focused field).
      ep.tabIndex = -1;
      isolateControl(ep);
      ep.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        openEpFor?.();
      });
      actionsCell.appendChild(ep);
    }
    row.append(name, valueCell, actionsCell);
  };

  const body = doc.createElement("tbody");
  for (const section of sections) {
    // Optional per-group header (the functionality / standard-configuration name).
    if (section.title && sections.length > 1) {
      const titleRow = doc.createElement("tr");
      titleRow.className = "codbi-func-section-title";
      const titleCell = doc.createElement("th");
      titleCell.scope = "colgroup";
      titleCell.colSpan = 3;
      titleCell.textContent = section.title;
      titleRow.appendChild(titleCell);
      body.appendChild(titleRow);
    }
    const present = new Set(section.params.map((p) => p.name.toLowerCase()));
    for (const param of section.params) {
      const row = doc.createElement("tr");
      row.dataset.param = param.name;
      row.dataset.value = param.value;
      addRow(row, section);
      body.appendChild(row);
    }
    // "Add parameter" dropdown: the functionality's available params not yet present here. This is a
    // CUSTOM dropdown built inside the badge — NOT a native <select>. A native select opens an OS
    // picker that moves focus and the pointer outside the badge, collapsing the hover-driven popup.
    // A custom trigger reveals the available parameters as INLINE table rows (not a floating overlay),
    // because the popup has `overflow:hidden` and would clip any floating menu. Every interaction
    // therefore stays inside the table/badge, so the popup stays open and the newly-added parameter's
    // value input can be focused immediately.
    const missing = section.available.filter((name) => !present.has(name.toLowerCase()));
    if (missing.length > 0) {
      const addRowEl = doc.createElement("tr");
      addRowEl.className = "codbi-func-addrow";
      const labelCell = doc.createElement("th");
      labelCell.scope = "row";
      labelCell.textContent = `\u002b ${i18n("designer.marker.table.add")}`;
      const selectCell = doc.createElement("td");
      selectCell.colSpan = 2;
      // The trigger button, e.g. "Parameter auswählen…".
      const trigger = doc.createElement("button");
      trigger.type = "button";
      trigger.className = "codbi-func-addtrigger";
      trigger.dataset.cbOpen = "0";
      trigger.textContent = i18n("designer.marker.table.pick");
      trigger.title = i18n("designer.marker.table.pick");
      isolateControl(trigger);
      // The inline option rows, inserted right after the add-row while the trigger is open. Each row
      // lists one of the functionality's available parameters; clicking it adds the parameter IN PLACE.
      const optionRows: HTMLTableRowElement[] = [];
      const refreshRows = (): void => {
        if (trigger.dataset.cbOpen !== "1") {
          return;
        }
        for (const optRow of optionRows) {
          if (optRow.isConnected) {
            optRow.remove();
          }
        }
        for (const attrName of missing) {
          if (present.has(attrName.toLowerCase())) {
            continue;
          }
          const optRow = doc.createElement("tr");
          optRow.className = "codbi-func-addoption";
          optRow.dataset.param = attrName;
          const optCell = doc.createElement("td");
          optCell.colSpan = 3;
          optCell.textContent = paramLabel(attrName);
          // Same localized description tooltip as the (already-present) parameter rows, so hovering an
          // available parameter in the "add" dropdown also shows its description.
          const optionSpec = parameterSpecFor(section.funcKey, attrName);
          const optionDescription = localizedParameterDescription(optionSpec);
          if (optionDescription) {
            optCell.title = optionDescription;
          }
          optRow.appendChild(optCell);
          isolateControl(optRow);
          optRow.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopImmediatePropagation();
            event.stopPropagation();
            const target = resolve();
            // Remember the parameter being added so that AFTER the debounced badge re-render
            // (`setFuncAttribute` → designer mutation → `refreshBadges` → `ensureFuncBadge` →
            // `badge.replaceChildren`) the freshly-built value input is re-focused again and the
            // popup is re-expanded. Without this, the rebuild leaves the popup collapsed at icon size.
            pendingAddedParam = attrName;
            if (setFuncAttribute(target, attrName, "")) {
              present.add(attrName.toLowerCase());
              // Add the new parameter row IN PLACE and focus its value input. Because the whole
              // interaction stays inside the badge, focus and hover are preserved, so the popup stays
              // open and the user can immediately type the value.
              const row = doc.createElement("tr");
              row.dataset.param = attrName;
              row.dataset.value = "";
              addRow(row, section);
              body.insertBefore(row, addRowEl);
              const input = row.querySelector<HTMLInputElement>("input.codbi-func-input");
              input?.focus();
              input?.select();
              refreshRows();
              if (missing.every((name) => present.has(name.toLowerCase()))) {
                addRowEl.remove();
              }
            }
          });
          optionRows.push(optRow);
          body.insertBefore(optRow, addRowEl);
        }
      };
      const openMenu = (open: boolean): void => {
        trigger.dataset.cbOpen = open ? "1" : "0";
        if (open) {
          trigger.classList.add("codbi-func-addtrigger--open");
        } else {
          trigger.classList.remove("codbi-func-addtrigger--open");
        }
        refreshRows();
      };
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        openMenu(trigger.dataset.cbOpen !== "1");
      });
      selectCell.appendChild(trigger);
      addRowEl.append(labelCell, selectCell);
      body.appendChild(addRowEl);
    }
  }
  table.appendChild(body);
  return table;
}

/**
 * Builds the badge's inner DOM: the CodBi logo icon plus the list of functionality sub-badges
 * (orange) and CSS-standard-configuration-class sub-badges (blue). The list is revealed when the
 * widget is hovered; hovering one functionality sub-badge expands it downward to show that
 * functionality's `data-cb-*` parameters (see `BADGE_CSS`).
 */
function buildFuncBadgeInner(
  doc: Document,
  funcs: IFunctionalityEntry[],
  cssClasses: string[],
  holistic: IActiveHolisticConfig[],
  resolve: () => IMarkerItemLike,
  anchor: HTMLElement,
  badge?: HTMLDivElement,
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
  // Only clear the tracked open sub-badge when the pointer leaves the ENTIRE badge, never on a
  // mere `focusout` — otherwise moving from the focused value input up to the "+ Add" trigger (to add
  // a second parameter) would wipe it and the following rebuild would collapse the table.
  list.addEventListener("mouseleave", () => {
    openFuncSubBadge = null;
  });
  // Open exactly ONE sub-badge at a time. Opening another sub-badge (hover or focus) must first
  // close every other one — otherwise moving the pointer from badge A to badge B leaves A's `--open`
  // class intact and BOTH tables stay expanded.
  const openOnly = (active: HTMLElement): void => {
    for (const sibling of Array.from(
      list.querySelectorAll<HTMLElement>(".codbi-func-item, .codbi-css-item, .codbi-holistic-item"),
    )) {
      if (sibling !== active) {
        sibling.classList.remove("codbi-func-item--open");
        sibling.classList.remove("codbi-css-item--open");
        sibling.classList.remove("codbi-holistic-item--open");
      }
    }
  };
  if (funcs.length > 0 || cssClasses.length > 0 || holistic.length > 0) {
    for (const func of funcs) {
      const item = doc.createElement("div");
      item.className = "codbi-func-item";
      item.dataset.cbSub = func.name;
      const name = doc.createElement("span");
      name.className = "codbi-func-item__name";
      name.textContent = func.name;
      item.appendChild(name);
      // One section: the functionality's own set parameters PLUS an "add parameter" dropdown with every
      // parameter the functionality offers (even when none are set yet — the popup is always shown).
      const section: IParamTableSection = {
        title: func.name,
        params: func.params,
        available: availableParameterNames(func.name),
        funcKey: func.name,
      };
      const params = doc.createElement("div");
      params.className = "codbi-func-item__params";
      item.appendChild(params);
      item.addEventListener("mouseenter", () => {
        openFuncSubBadge = func.name;
        openOnly(item);
        item.classList.add("codbi-func-item--open");
        applyFuncPopupWidth(item, params, anchor, params.dataset.codbiMax === "1");
      });
      // Keep the popup open while a control inside it (the "+ Add" select or a value input) holds
      // focus — hovering alone collapses once the pointer leaves the sub-badge (which happens as soon
      // as a native select picker closes). `focusin`/`focusout` cover every control in the popup.
      params.addEventListener("focusin", () => {
        openFuncSubBadge = func.name;
        openOnly(item);
        item.classList.add("codbi-func-item--open");
      });
      params.addEventListener("focusout", () => {
        // Remove the focus-held `--open` (standard focus retention), but KEEP `openFuncSubBadge`.
        // Clearing it here is what made the SECOND "add parameter" collapse: when the user moves from
        // the focused value input up to the "+ Add" trigger, `focusout` fires, wiping the tracked
        // sub-badge — so the following rebuild could no longer re-expand the table. The tracked badge
        // must survive until the user actually leaves the whole badge (see the `mouseleave` below).
        item.classList.remove("codbi-func-item--open");
      });
      // Survive a badge rebuild: if this sub-badge was open before, keep it open on the fresh DOM.
      if (openFuncSubBadge === func.name) {
        item.classList.add("codbi-func-item--open");
      }
      params.appendChild(buildParamTable(doc, [section], resolve, anchor, item, params, "func", badge));
      list.appendChild(item);
    }
    // The applied CSS standard-configuration classes, shown as BLUE sub-badges. Each reveals the FULL
    // parameter table accumulated across every functionality named in the class's `FUNC` list.
    for (const cssClass of cssClasses) {
      const item = doc.createElement("div");
      item.className = "codbi-css-item";
      item.dataset.cbSub = cssClass;
      const name = doc.createElement("span");
      name.className = "codbi-css-item__name";
      name.textContent = cssClass;
      item.appendChild(name);
      const sections = buildCssClassSections(cssClass, resolve());
      const params = doc.createElement("div");
      params.className = "codbi-func-item__params";
      item.appendChild(params);
      item.addEventListener("mouseenter", () => {
        openFuncSubBadge = cssClass;
        openOnly(item);
        item.classList.add("codbi-css-item--open");
        applyFuncPopupWidth(item, params, anchor, params.dataset.codbiMax === "1");
      });
      params.addEventListener("focusin", () => {
        openFuncSubBadge = cssClass;
        openOnly(item);
        item.classList.add("codbi-css-item--open");
      });
      params.addEventListener("focusout", () => {
        // Remove the focus-held `--open`, but KEEP `openFuncSubBadge` (see the func-loop comment).
        item.classList.remove("codbi-css-item--open");
      });
      // Survive a badge rebuild: if this sub-badge was open before, keep it open on the fresh DOM.
      if (openFuncSubBadge === cssClass) {
        item.classList.add("codbi-css-item--open");
      }
      params.appendChild(buildParamTable(doc, sections, resolve, anchor, item, params, "css", badge));
      list.appendChild(item);
    }
    // The active HOLISTIC standard-configurations that hit this element, shown as GREEN sub-badges.
    // Each is named by its config id and reveals the parameter table of the FUNC it applies to the
    // element (the same `data-cb-*` bag the runtime resolves per-element overrides from).
    for (const config of holistic) {
      const item = doc.createElement("div");
      item.className = "codbi-holistic-item";
      item.dataset.cbSub = config.id;
      const name = doc.createElement("span");
      name.className = "codbi-holistic-item__name";
      name.textContent = config.id;
      item.appendChild(name);
      const sections = buildHolisticSections(config.id, config.def, resolve());
      const params = doc.createElement("div");
      params.className = "codbi-func-item__params";
      item.appendChild(params);
      item.addEventListener("mouseenter", () => {
        openFuncSubBadge = config.id;
        openOnly(item);
        item.classList.add("codbi-holistic-item--open");
        applyFuncPopupWidth(item, params, anchor, params.dataset.codbiMax === "1");
      });
      params.addEventListener("focusin", () => {
        openFuncSubBadge = config.id;
        openOnly(item);
        item.classList.add("codbi-holistic-item--open");
      });
      params.addEventListener("focusout", () => {
        // Remove the focus-held `--open`, but KEEP `openFuncSubBadge` (see the func-loop comment).
        item.classList.remove("codbi-holistic-item--open");
      });
      // Survive a badge rebuild: if this sub-badge was open before, keep it open on the fresh DOM.
      if (openFuncSubBadge === config.id) {
        item.classList.add("codbi-holistic-item--open");
      }
      params.appendChild(buildParamTable(doc, sections, resolve, anchor, item, params, "holistic", badge));
      list.appendChild(item);
    }
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
  const cssClasses = existingCssClasses(item);
  // The active holistic configurations whose `targets` selector resolves to this element (green
  // sub-badges). Re-evaluated on every refresh so toggling a holistic config Active re-marks widgets.
  const holistic = holisticConfigsFor(anchor);
  // Fold in the holistic config ids AND the `data-cb-*` parameters their `FUNC`s can carry, so
  // toggling a config Active or editing a parameter via a GREEN sub-badge re-renders the badge.
  const signature = `${funcSignature(funcs, cssClasses, item)}\u0006${holistic
    .map((c) => c.id)
    .join("\u0001")}\u0006${holisticParamsSignature(holistic, item)}`;

  let badge = funcBadges.get(id);
  if (!badge || !badge.isConnected || badge.parentElement !== anchor) {
    badge = doc.createElement("div");
    badge.className = `${BADGE_CLASS} codbi-elem-badge--funcs`;
    badge.dataset.codbiBadge = id;
    funcBadges.set(id, badge);
    // Keep the badge expanded while any control inside it (select / value input) holds focus, so the
    // popup does not collapse when the pointer leaves the widget (e.g. while a native select is open).
    if (!badge.dataset.codbiFocusWired) {
      badge.dataset.codbiFocusWired = "1";
      badge.addEventListener("focusin", () => {
        badge.classList.add("codbi-elem-badge--focus-active");
      });
      badge.addEventListener("focusout", () => {
        badge.classList.remove("codbi-elem-badge--focus-active");
      });
    }
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
  // With no known functionality, CSS class or holistic config the badge must not expand (mirrors the
  // Mirror `--empty` behaviour).
  badge.classList.toggle(
    "codbi-elem-badge--empty",
    funcs.length === 0 && cssClasses.length === 0 && holistic.length === 0,
  );
  // Resolve the item freshly on every edit (the badge may outlive the Item instance it was built for).
  const resolve = (): IMarkerItemLike => resolveFuncItem(id, anchor, item);
  badge.replaceChildren(buildFuncBadgeInner(doc, funcs, cssClasses, holistic, resolve, anchor, badge));
  // If a parameter was just added via the "+ Add" dropdown, move focus into its new value input so
  // the popup stays open (and the user can type) instead of collapsing back to icon size.
  restorePendingParamFocus(badge);
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
    for (const item of Object.values(items)) {
      const isMirror = isMirrorItem(item);
      const anchor = anchorFor(item);
      const cbFunc = isCbFuncItem(item);
      const css = hasCssClasses(item);
      // The per-element holistic resolution ALSO logs each anchor match/failure — see holisticConfigsFor.
      const hol = holisticConfigsFor(anchor).length > 0;
      // A "marked" element carries a `data-cb-func` functionality and/or a CodBi standard-config
      // CSS class (orange/blue sub-badges) and/or is a target of an ACTIVE holistic configuration
      // (green sub-badge) — any of these earns the CodBi badge on the element.
      const isFunc = cbFunc || css || hol;
      const itemId = item.getId?.() ?? "";
      // In preview mode we ALSO need to reach plain elements (fields, fieldsets, containers, pages)
      // so they get their own preview switch — so don't bail out on non-widget items in that mode.
      if (!isMirror && !isFunc && !elementPreview) {
        continue;
      }
      if (anchor) {
        // Always inject the stylesheet + observe the canvas root (placeholder icon, see BADGE_CSS).
        const root = rootFor(anchor);
        installBadgeStyles(root);
        observeRoot(root);
      }
      const id = item.getId?.() ?? "";
      if (isMirror) {
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
      // Drop markers' badges whose item no longer exists or no longer carries a `data-cb-func`
      // functionality or a CodBi standard-config CSS class.
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
  const key = event.key.toLowerCase();
  if (event.altKey && key === "v") {
    event.preventDefault();
    toggleMarkMode();
  }
  // NOTE: ALT+P is intentionally NOT handled here — it is reserved for the attribute-editor
  // shortcut that lists a functionality's parameters (see LocalDocInterface). A previous ALT+P
  // binding here toggled the per-element preview (writing `data-cb-preview`) and stole that shortcut.
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
    // Dedicated `items-created` hook; the `return new Set()` below is essential (see the comment).
    try {
      (
        Callbacks["items-created"] as unknown as {
          add(listener: () => unknown): void;
        }
      ).add(() => {
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
  } catch (x) {
    console.error("[CodBi] Element markers: initialization failed", x);
  }
}
