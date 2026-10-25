// #region Imports
import { $, Callbacks, getDesignerConfig, instance as getDesignerInstance } from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
import { MARK_ELEMENTS_CHANGED_EVENT } from "./CodbiSwitchEditor.js";
import { openEPBuilder } from "./EPBuilder.js";
import { mirrorElementOptions, mirrorFormOptions } from "./MirrorSelect.js";
import {
  formatMessage,
  requestStandardConfigActivation,
  standardConfigClassIsInactive,
  standardConfigOwnerOfClass,
} from "./StandardConfigActivation.js";
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
 * A BLUE class sub-badge whose owning standard configuration is **not activated** for the form is
 * DIMMED (`.5` opacity) and outlined with a DASHED RED border: the class alone is only a marker then.
 * Clicking that dimmed sub-badge opens the SAME “activate this standard configuration?” question the
 * per-element CodBi panel uses (see `StandardConfigActivation.ts`); once it is activated the badge
 * repaints at full opacity with its normal solid blue border.
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

/**
 * Last preview signature applied per item id. Unlike {@link previewApplied} (keyed by the anchor DOM
 * node) this survives the designer's re-render, which replaces the anchor after a property edit. It
 * lets us tell "first activation" apart from "the element was already previewed and its attributes
 * changed": only the latter must wait for the draft sync before the iframe reloads.
 */
const previewAppliedById = new Map<string, string>();

/**
 * Monotonic revision of all **form-level** settings that influence every rendered widget — the active
 * standard configurations (including holistic ones) and the form's global variables. It is folded into
 * {@link elementPreviewSignature}, so bumping it re-applies every RUNNING element preview after the
 * change. {@link notifyFormPreviewChanged} is called by the variables editor (ALT+V) and the
 * standard-configuration selector of the CodBi form options.
 */
let formPreviewRevision = 0;

/**
 * Delay before a RUNNING element preview is re-applied after a `data-cb-*` attribute change. The
 * preview page renders the SERVER-side draft, so the designer's persist differ needs time to sync the
 * change before the iframe reloads — otherwise the preview would re-render the OLD attribute values.
 */
const PREVIEW_REAPPLY_DELAY_MS = 1500;

/**
 * Pending debounced preview re-applies, keyed by the preview wrapper. A single timer per wrapper is
 * kept: additional refreshes while it is pending do not postpone it (the timer re-reads the live item,
 * so it always reloads with the latest attribute values).
 */
const previewReapplyTimers = new WeakMap<HTMLElement, number>();

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
.codbi-elem-badge{position:absolute;top:4px;left:0;transform:translateX(6px);z-index:5;display:inline-flex;align-items:center;height:22px;box-sizing:border-box;overflow:hidden;background:rgba(255,255,255,.94);border:1px solid darkorange;border-radius:5px;box-shadow:0 1px 3px rgba(15,23,42,.28);opacity:.3;transition:opacity .15s ease;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:11px;line-height:1;color:#374151;pointer-events:none;user-select:none;white-space:nowrap}
/* Mirror badges sit in the widget's BOTTOM-LEFT corner (the function/CodBi badges keep top-left).
   They are deliberately stacked BELOW the functionality badge/popup (lower z-index), so when both
   are displayed the functionality widget's parameter table is drawn over/in front of the mirror
   badge instead of the mirror badge covering it. */
.codbi-elem-badge--bottom{top:auto;bottom:4px;left:0;z-index:4}
.codbi-elem-badge__icon{flex:0 0 auto;width:20px;height:20px;box-sizing:border-box;margin:0 1px;pointer-events:none;background-repeat:no-repeat;background-position:center;background-size:16px 16px;filter:drop-shadow(0 0 1.5px rgba(56,189,248,.85)) drop-shadow(0 0 3px rgba(37,99,235,.45))}
.codbi-elem-badge__text{display:inline-block;max-width:0;overflow:hidden;opacity:0;pointer-events:none;transition:max-width .25s ease,opacity .25s ease,padding .25s ease}
/* The badge stays VERY TRANSPARENT so it never hides the widget content it overlaps; hovering the
   widget (or opening/focusing the badge) restores full opacity. The text EXPANSION, however, is
   badge-hover-only: hovering the widget alone must not widen the badge. Because the badge never
   captures the pointer (see the drop-target note after BADGE_CSS), the JS proximity tracker
   installBadgeHoverTracking sets the --hover class instead of CSS :hover. */
*:hover>.codbi-elem-badge{opacity:1}
.codbi-elem-badge--focus-active{opacity:1}
/* "Detailed" mode: the badge is expanded only while its form element is hovered, never permanently. */
.codbi-elem-marked:hover>.codbi-elem-badge--open{opacity:1}
*:hover>.codbi-elem-badge:not(.codbi-elem-badge--empty){border-color:#c96a00;background:#fff7ed}
.codbi-elem-badge--hover:not(.codbi-elem-badge--empty) .codbi-elem-badge__text{max-width:640px;opacity:1;padding:0 8px 0 0}
.codbi-elem-marked:hover>.codbi-elem-badge--open .codbi-elem-badge__text{max-width:640px;opacity:1;padding:0 8px 0 0}
/* The marked (highlight) overlay. The visible rounded tint is drawn by a ::after OVERLAY (on top of
   the element) rather than by the element itself: form-designer content cells fill themselves with
   child wrappers whose own rectangular background would cover the element's rounded corners, and
   their overflow would clip an outer glow. The overlay is always roundrect and sits above every
   child, so the highlight is readable on any element.
   The codbi-elem-marked class is only assigned while the CodBi markers (Alt+V) are turned on, so
   the VERY TRANSPARENT blue background stays visible the whole time the markers are active — not
   just on hover. No border and no glow are drawn, keeping the highlight unobtrusive. */
.codbi-elem-marked{position:relative!important;overflow:visible!important;z-index:2}
.codbi-elem-marked::after{content:"";position:absolute;inset:0;pointer-events:none;box-sizing:border-box;border:0;border-radius:10px;background:rgba(37,99,235,.04);z-index:1;opacity:1}
/* Lift the WHOLE marked widget above NEIGHBOURING widgets while one of its functionality sub-badges
   (or the parameter menu it reveals) is hovered or holds focus. Each .codbi-elem-marked element
   forms its own stacking context at z-index:2, so the absolutely-positioned parameter menu
   (z-index:6 INSIDE its own widget) is otherwise trapped below a neighbouring marked widget that
   comes later in the DOM - e.g. an expanded Mirror-widget badge would paint OVER the menu. Raising
   the widget that owns the active sub-badge puts its whole subtree, menu included, on top. The
   :has() selector keeps this stateless and limited to the widget the pointer is actually using. */
.codbi-elem-marked:has(.codbi-func-item:hover),
.codbi-elem-marked:has(.codbi-css-item:hover),
.codbi-elem-marked:has(.codbi-holistic-item:hover),
.codbi-elem-marked:has(.codbi-func-item--open),
.codbi-elem-marked:has(.codbi-css-item--open),
.codbi-elem-marked:has(.codbi-holistic-item--open),
.codbi-elem-marked:has(.codbi-func-item__params:hover),
.codbi-elem-marked:has(.codbi-elem-badge--funcs:focus-within){z-index:9000}
/* The SAME lift, driven by JS instead of the has() selector (see raiseMarkedWidget /
   lowerMarkedWidget). The parameter table opens DOWNWARD and therefore overlaps the form elements
   BELOW its own widget; those are marked widgets too and would otherwise paint OVER the table (each
   marked widget is its own stacking context). The has() selector is not available in every browser
   the designer runs in, and a form element may legitimately sit inside a container that forms its
   own stacking context - so the owning widget is raised EXPLICITLY while its badge is hovered or
   holds focus, above every other layer of the form. The two-class selector beats the base
   z-index:2 rule regardless of the order. */
.codbi-elem-marked.codbi-elem-marked--raised{z-index:2147483000}
.codbi-mirror-icon{background-image:url("${MIRROR_ICON_URL}");background-repeat:no-repeat;background-position:center;background-size:contain}
.codbi-mirror-icon svg{display:none}
.codbi-elem-badge--funcs{overflow:visible;z-index:50}
.codbi-func-icon{background-image:url("${CODBI_LOGO_URL}")}
/* NOTE: opacity is deliberately NOT transitioned on the list, the sub-badges or the parameter popup.
   A fade makes the whole popup translucent while animating; on a Mirror widget (whose backdrop differs)
   that reads as a see-through table, and the live Mirror preview re-renders keep restarting the fade.
   The reveal still animates via max-width/padding/transform, but opacity snaps to 0/1 instantly. */
.codbi-func-list{display:inline-flex;align-items:center;gap:4px;max-width:0;overflow:hidden;opacity:0;pointer-events:none;transition:max-width .25s ease,padding .25s ease}
.codbi-elem-badge--funcs.codbi-elem-badge--hover>.codbi-func-list{max-width:2000px;overflow:visible;opacity:1;padding:0 6px 0 2px;pointer-events:auto}
.codbi-func-item{position:relative;display:inline-flex;align-items:center;height:18px;box-sizing:border-box;padding:0 6px;border:1px solid #c96a00;border-radius:4px;background:#fff7ed;color:#7c2d12;font-size:11px;line-height:1;white-space:nowrap;pointer-events:auto;opacity:0}
/* The CSS-standard-configuration-class sub-badges are BLUE to distinguish them from the orange
   functionality sub-badges. */
.codbi-css-item{position:relative;display:inline-flex;align-items:center;height:18px;box-sizing:border-box;padding:0 6px;border:1px solid #1d4ed8;border-radius:4px;background:#eff6ff;color:#1e40af;font-size:11px;line-height:1;white-space:nowrap;pointer-events:auto;opacity:0}
/* The HOLISTIC standard-configuration sub-badges are GREEN to mark elements that a runtime
   selector-resolved (holistic) configuration applies to. */
.codbi-holistic-item{position:relative;display:inline-flex;align-items:center;height:18px;box-sizing:border-box;padding:0 6px;border:1px solid #15803d;border-radius:4px;background:#ecfdf5;color:#14532d;font-size:11px;line-height:1;white-space:nowrap;pointer-events:auto;opacity:0}
/* Reveal the sub-badges only once the list is expanded (prevents a flash while overflow is still hidden). */
.codbi-elem-badge--funcs.codbi-elem-badge--hover>.codbi-func-list>.codbi-func-item{opacity:1}
.codbi-elem-badge--funcs.codbi-elem-badge--hover>.codbi-func-list>.codbi-css-item{opacity:1}
.codbi-elem-badge--funcs.codbi-elem-badge--hover>.codbi-func-list>.codbi-holistic-item{opacity:1}
/* "Detailed" mode: reveal the functionality list while the owning form element is hovered.
   The parameter table stays hover-only, since no --open rule targets it. */
.codbi-elem-marked:hover>.codbi-elem-badge--open .codbi-func-list{max-width:2000px;overflow:visible;opacity:1;padding:0 6px 0 2px;pointer-events:auto}
.codbi-elem-marked:hover>.codbi-elem-badge--open .codbi-func-list>.codbi-func-item{opacity:1}
.codbi-elem-marked:hover>.codbi-elem-badge--open .codbi-func-list>.codbi-css-item{opacity:1}
.codbi-elem-marked:hover>.codbi-elem-badge--open .codbi-func-list>.codbi-holistic-item{opacity:1}
/* While any control inside the badge (the "+ Add" select or a value input) holds focus the whole
   functionality list stays expanded even if the pointer is no longer over the widget — a native
   select dropdown can move the cursor away, which would otherwise collapse the badge. */
.codbi-elem-badge--focus-active .codbi-func-list{max-width:2000px;overflow:visible;opacity:1;padding:0 6px 0 2px;pointer-events:auto}
.codbi-elem-badge--focus-active .codbi-func-list>.codbi-func-item{opacity:1}
.codbi-elem-badge--focus-active .codbi-func-list>.codbi-css-item{opacity:1}
.codbi-elem-badge--focus-active .codbi-func-list>.codbi-holistic-item{opacity:1}
/* A BLUE standard-configuration class sub-badge whose owning configuration is NOT activated for the
   form is only a MARKER: it is dimmed to .5 opacity, outlined with a DASHED RED border and a CLICK asks
   whether that configuration shall be activated (see requestStandardConfigActivation). The rules repeat
   the reveal selectors above so they win over their opacity:1 and their blue border; once the
   configuration is activated the badge repaints at full opacity with its normal solid blue border (the
   activation state is part of the badge's change signature). */
.codbi-elem-badge--funcs.codbi-elem-badge--hover>.codbi-func-list>.codbi-css-item--inactive,
.codbi-elem-marked:hover>.codbi-elem-badge--open .codbi-func-list>.codbi-css-item--inactive,
.codbi-elem-badge--focus-active .codbi-func-list>.codbi-css-item--inactive{opacity:.5;cursor:pointer;border:1px dashed #dc2626}
.codbi-elem-badge--funcs.codbi-elem-badge--hover>.codbi-func-list>.codbi-css-item--inactive:hover,
.codbi-elem-marked:hover>.codbi-elem-badge--open .codbi-func-list>.codbi-css-item--inactive:hover,
.codbi-elem-badge--focus-active .codbi-func-list>.codbi-css-item--inactive:hover{opacity:.8;border-color:#b91c1c}
.codbi-func-item__name{pointer-events:none}
.codbi-css-item__name{pointer-events:none}
.codbi-holistic-item__name{pointer-events:none}
.codbi-func-item__params{position:absolute;top:100%;left:-1px;margin-top:3px;z-index:60;width:max-content;max-width:var(--codbi-func-anchor-width,320px);box-sizing:border-box;padding:0 6px;border:1px solid #c96a00;border-radius:4px;background:#fff;box-shadow:0 2px 6px rgba(15,23,42,.3);color:#374151;visibility:hidden;opacity:0;max-height:0;overflow:hidden;transform:translateY(-4px);transition:max-height .25s ease,transform .25s ease,padding .25s ease,visibility .25s}
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
/* Give the parameter table (and its body) a SOLID background. The popup itself is only 98% opaque, and
   a Mirror widget renders ANOTHER form's theme CSS into the same canvas - that theme's generic
   table/tbody rules can otherwise make this table's body look see-through ONLY on a Mirror widget.
   Setting it here (high specificity + !important) keeps the table opaque everywhere; header cells and
   hovered option rows still paint their own variant colours above it. */
.codbi-func-item__params>.codbi-func-table,
.codbi-func-item__params>.codbi-func-table>tbody{background:#fff!important}
/* The row-group white alone can be bypassed inside a Mirror widget's (open) shadow root: slotted or
   positioned Mirror content may paint between the row-group background and the otherwise-transparent
   parameter cells. Back the PARAMETER cells with white too. Section titles, the "add" row, the inline
   option rows, the header and every hover/checked state keep their own backgrounds - those rows are
   excluded here so their colours are never overridden. */
.codbi-func-table tbody tr:not(.codbi-func-section-title):not(.codbi-func-addrow):not(.codbi-func-addoption)>td,
.codbi-func-table tbody tr:not(.codbi-func-section-title):not(.codbi-func-addrow):not(.codbi-func-addoption)>th{background:#fff}
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
.codbi-func-addoption:hover td{background-image:linear-gradient(#eff6ff,#eff6ff);text-decoration:underline}
.codbi-func-table--css .codbi-func-addoption td{color:#1e40af}
.codbi-func-table--css .codbi-func-addoption:hover td{background-image:linear-gradient(#dbeafe,#dbeafe)}
.codbi-func-table--holistic .codbi-func-addoption td{color:#15803d}
.codbi-func-table--holistic .codbi-func-addoption:hover td{background-image:linear-gradient(#d1fae5,#d1fae5)}
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
   cell, so it needs its own hide-children + pointer rules. The CodBi marker badges are EXCLUDED from
   the hiding: a widget keeps its marker (and its functionality/parameter popup) while it is being
   previewed, otherwise activating a preview made the marker disappear. They are also lifted above the
   preview iframe (z-index:8) — the functionality badge stays in front of the Mirror badge. */
.codbi-elem-preview{outline:2px dashed rgba(255,140,0,.55);outline-offset:2px}
.codbi-elem-preview.codbi-func-preview--rendered > *:not(.codbi-func-preview-frame):not(.codbi-func-preview-switch):not(.codbi-elem-badge){display:none !important}
.codbi-elem-preview.codbi-func-preview--rendered > .codbi-elem-badge--funcs{z-index:60}
.codbi-elem-preview.codbi-func-preview--rendered > .codbi-elem-badge--bottom{z-index:55}
.codbi-elem-preview.codbi-func-preview--rendered{pointer-events:auto !important}
/* In PREVIEW mode the widget content is replaced by an iframe, whose internal pointer events do not
   bubble to the widget cell, so the badge itself must capture the pointer (preview mode has no
   drop-on-item concern). wireBadgeHoverEvents toggles the same --hover class as the design-mode
   proximity tracker. */
.codbi-elem-preview.codbi-func-preview--rendered > .codbi-elem-badge{pointer-events:auto}
`;
// NOTE: the Mirror badge never captures the pointer (not even its icon/text). A hover-capturing
// overlay inside an item can become the drop target when a new element is dropped onto the widget,
// which breaks the designer's drop-on-item logic. Its expansion is therefore driven by
// `installBadgeHoverTracking`, which toggles `.codbi-elem-badge--hover` from pointer proximity
// without ever making the badge a hit target.
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

/**
 * The CodBi function badges injected so far, keyed by the item id. Typed as `HTMLDivElement` because
 * the badge is always created as a `<div>` and the parameter table builder expects that exact shape.
 */
const funcBadges = new Map<string, HTMLDivElement>();

/** Widget cells whose badge-hover proximity listeners have already been installed. */
const badgeHoverTracked = new WeakSet<HTMLElement>();

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
/**
 * Canvas roots whose `MutationObserver` is installed (keyed by root so the pending records can be
 * drained, see {@link discardSelfMutations}).
 */
const observedRoots = new Map<TMarkerRoot, MutationObserver>();

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
 * The latest state reported by the **“Preview”** switch (`CodbiSwitchEditor`), `null` until it
 * reports. It is kept separate from {@link switchEnabled} because both form properties reuse the
 * same editor (and the same change event) — mixing them would let one switch flip the other mode.
 */
let previewSwitchEnabled: boolean | null = null;

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
 * Whether the opt-in badge-table diagnostics are enabled. The flag may be set in ANY of the nested
 * frames (the app, the designer, or the canvas iframe) — the console a user happens to have open is
 * usually an ANCESTOR frame, so checking only this frame's `window` missed it in practice.
 */
function badgeTableDebugEnabled(): boolean {
  const enabled = (win: Window | null | undefined): boolean => {
    try {
      return Boolean((win as unknown as { CodbiBadgeTableDebug?: boolean } | null)?.CodbiBadgeTableDebug);
    } catch {
      return false;
    }
  };
  return enabled(window) || enabled(window.parent) || enabled(window.top);
}

/**
 * Locates the designer property VIEW's editor bound to `property` (e.g. `attributes`, `cssclasses`)
 * on the currently selected item. Some designer builds key the editor differently, so the lookup
 * falls back to scanning the mounted editors by their `config.property`.
 *
 * @param property The designer property name (e.g. `attributes`).
 */
function findPropertyEditor(
  property: string,
): { setValue?: (v: unknown) => void; triggerSetProperty?: () => void } | undefined {
  const view = designerInstance()?.getPropertyView?.();
  return (view?.getEditorForProperty?.(property) ??
    view?.getPropertyEditors?.().find((ed) => ed?.config?.property === property)) as
    | { setValue?: (v: unknown) => void; triggerSetProperty?: () => void }
    | undefined;
}

/**
 * When the edited item is the SELECTED one, the designer's AttributesEditor (the grid in the
 * element config's "attributes" table) is mounted and holds its own copy of the data — so a direct
 * model mutation alone would not refresh it. This pushes the current attribute array back into that
 * editor and commits it through the designer's own property pipeline, keeping the visible table and
 * the persisted model in sync.
 */
function findAttributesEditor(): { setValue: (v: string) => void; triggerSetProperty?: () => void } | undefined {
  return findPropertyEditor("attributes") as
    | { setValue: (v: string) => void; triggerSetProperty?: () => void }
    | undefined;
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
    const editor = findAttributesEditor();
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
 * Refreshes the OPEN AttributesEditor grid for an item whose attributes were just mutated in place —
 * but WITHOUT committing through the designer's property pipeline. This is the light half of
 * {@link syncAttributesEditor}: it re-pushes the (already updated) attribute array into the grid's own
 * copy so the visible table updates immediately, yet skips `triggerSetProperty`, so it does not fire
 * the expensive `set-property` re-valuation that makes per-keystroke edits on the SELECTED item slow.
 *
 * Only runs for the SELECTED master item (the grid is bound to it); for every other item the grid is
 * not showing that item's data, so there is nothing to refresh.
 */
function refreshAttributesGrid(item: IMarkerItemLike): void {
  try {
    const designer = designerInstance();
    if (!designer) {
      return;
    }
    const selected = designer.getSelectedMasterItem?.();
    if (selected !== item) {
      return;
    }
    const editor = findAttributesEditor();
    if (!editor?.setValue) {
      // No mounted attributes grid to refresh — nothing to do (the change is already in the bags).
      return;
    }
    const attrs = propertiesOf(item)?.attributes;
    editor.setValue(JSON.stringify(Array.isArray(attrs) ? attrs : []));
  } catch (x) {
    console.warn("[CodBi] Element markers: could not refresh the attributes editor", x);
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
  // Re-apply the badges/previews: a changed `data-cb-*` attribute changes the element's preview
  // signature, and the debounced re-apply then reloads a running preview with the synced values.
  scheduleRefresh();
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
 * writes the attribute directly into the item's property bags and nudges the persist differ, then
 * refreshes the (mounted) attributes grid's own copy so the visible table updates immediately — yet it
 * skips `triggerSetProperty`, so it never fires the expensive `set-property` re-valuation that makes
 * edits on the SELECTED item slow (the very lag the badge tables avoid).
 *
 * @param item  The target item.
 * @param name  The attribute name (e.g. `data-cb-reverse`).
 * @param value The new attribute value.
 *
 * @returns **True** when the attribute was written. */
export function setItemAttributeValueQuiet(item: IMarkerItemLike, name: string, value: string): boolean {
  const ok = writeAttrBags(item, name, value);
  if (ok) {
    refreshAttributesGrid(item);
  }
  return ok;
}

/**
 * Sets or updates one TOP-LEVEL property (e.g. `funcs` / `funcs_name`) in every writable property bag
 * of an item and nudges the persist differ — WITHOUT firing the designer's `set-property` callback.
 *
 * This is the property-level analogue of {@link setItemAttributeValueQuiet}. Firing `set-property`
 * makes the designer re-valuate the whole property view of the SELECTED item (~1s), which is what made
 * toggling a functionality in the per-element CodBi config panel feel slow. Writing the property bags
 * directly (the very bags `getPersist().properties` / the designer's `selectedProperty` read) and
 * nudging the differ is instant — the same mechanism the parameter writes and the standard-config
 * class toggle already use.
 *
 * @param item  The target item.
 * @param name  The property name (e.g. `funcs`).
 * @param value The new property value.
 *
 * @returns **True** when the property was written into at least one bag. */
export function setItemPropertyValueQuiet(item: IMarkerItemLike, name: string, value: string): boolean {
  const bags = writablePropertyBags(item);
  if (bags.length === 0) {
    return false;
  }
  for (const props of bags) {
    props[name] = value;
  }
  notifyAttributeChange();
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
  // Removing a `data-cb-*` attribute changes the preview signature too — refresh badges/previews.
  scheduleRefresh();
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
 * removes the attribute directly from the item's property bags and nudges the persist differ, then
 * refreshes the (mounted) attributes grid's own copy so the visible table updates immediately — yet
 * it skips `triggerSetProperty`, so it never fires the expensive `set-property` re-valuation that
 * makes edits on the SELECTED item slow (the very lag the badge tables avoid).
 *
 * @param item The target item.
 * @param name The attribute name (e.g. `data-cb-reverse`).
 *
 * @returns **True** when the attribute was removed. */
export function removeFuncAttributeQuiet(item: IMarkerItemLike, name: string): boolean {
  const ok = removeAttrBags(item, name);
  if (ok) {
    refreshAttributesGrid(item);
  }
  return ok;
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
  /**
   * The CSS-Classes this configuration provides, keyed by class name. Under the optimised shape each
   * class's entry holds BOTH its description AND its FORMCYCLE widget list:
   * `classes[cssClass] = { description, formelementtypes?: string[] }`. `formelementtypes` absent/empty
   * ⇒ that class applies to **any** element (fail-open). A plain description `string` is the
   * legacy/manager form (also fail-open).
   */
  classes?: Record<string, { description?: string; formelementtypes?: string[] } | string>;
  globals?: Record<string, string>;
  /**
   * The FORMCYCLE widget-class marker of a **holistic** standard configuration. A regular
   * (non-holistic) config `.json` carries **no** value here — each regular CSS-Class's widget list
   * lives in its own `classes[cssClass].formelementtypes`, so per-class applicability needs no
   * `detFunctionalities`/functionality-registry resolution.
   *
   * Only the literal array `["Holistic"]` (case-insensitive) marks the configuration as a **holistic**
   * one — it resolves its targets by a runtime selector and is excluded from the per-element
   * standard-configuration listings of the CodBi panel. A bare `string`/`string[]` is the
   * legacy/synthetic file-level form (e.g. the local API-doc / manager channel). An absent property
   * means "any element" per class (fail-open when a class carries no widget list).
   */
  supportedFormelementtypes?: string[] | string;
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
 * Normalizes a raw `cssclasses` property value (the FORMCYCLE persist shape is an array of strings,
 * but a whitespace/comma separated string is handled defensively) into a de-duplicated, ordered list
 * of class names. Unrelated classes are preserved — the list is NOT filtered by `detStandards`.
 */
function parseCssClasses(raw: unknown): string[] {
  const parts = Array.isArray(raw) ? raw.map((c) => String(c)) : String(raw ?? "").split(/[\s,]+/);
  const result: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const name = part.trim();
    if (!name || seen.has(name)) {
      continue;
    }
    seen.add(name);
    result.push(name);
  }
  return result;
}

/**
 * Reads the element's `cssclasses` property and returns the subset that are recognized CodBi
 * standard-configuration classes.
 */
function existingCssClasses(item: IMarkerItemLike): string[] {
  const recognized = standardClassNames();
  return parseCssClasses(propertiesOf(item)?.[CSS_CLASSES_PROPERTY]).filter((name) => recognized.has(name));
}

/** @returns `true` when the item carries at least one recognized CodBi standard-configuration class. */
function hasCssClasses(item: IMarkerItemLike): boolean {
  return existingCssClasses(item).length > 0;
}

/**
 * The element's FULL `cssclasses` property (every class name, unrelated ones included). Exported so
 * the per-element CodBi config editor can render one checkbox per standard-configuration class with
 * its current applied state.
 */
export function elementCssClasses(item: IMarkerItemLike): string[] {
  return parseCssClasses(propertiesOf(item)?.[CSS_CLASSES_PROPERTY]);
}

/** @returns whether the element currently carries the CSS class `className`. */
export function elementHasCssClass(item: IMarkerItemLike, className: string): boolean {
  const wanted = className.trim();
  return wanted !== "" && elementCssClasses(item).includes(wanted);
}

/**
 * The item whose `cssclasses` editor value was postponed by {@link setElementCssClass} with
 * `deferNotify` — re-pushed into the designer's own editor on {@link flushElementCssClassChange}.
 */
let pendingCssClassEditorItem: IMarkerItemLike | null = null;

/**
 * Adds (`on === true`) or removes (`on === false`) ONE CSS class on the element's `cssclasses`
 * property in every writable property bag, then nudges the persist differ so the change is synced.
 *
 * Unlike the `data-cb-*` attribute writers this only touches the named class — every UNRELATED class
 * on the element is preserved. This is how a standard configuration is applied to a single element:
 * the class itself is the runtime hook (each configuration's `loadConfig({ targets: ".<class>",
 * FUNC })` matches elements by that class), so no `data-cb-func` needs to be written.
 *
 * @param item      The target item.
 * @param className The CSS class to add/remove (e.g. `CodBi_NoFutureDate`).
 * @param on        **True** to apply the class, **false** to remove it.
 * @param options   `deferNotify: true` writes the property bags ONLY — the persist-differ nudge (which
 *   syncs the draft, so FORMCYCLE re-renders the element preview) and the debounced badge/preview
 *   refresh are postponed until {@link flushElementCssClassChange} is called. Needed while a modal
 *   question is open, because re-rendering the canvas under it clips the preview and brings
 *   FORMCYCLE's own preview menu back.
 *
 * @returns **True** when at least one property bag was updated. */
export function setElementCssClass(
  item: IMarkerItemLike,
  className: string,
  on: boolean,
  options: { deferNotify?: boolean } = {},
): boolean {
  const name = className.trim();
  if (name === "") {
    return false;
  }
  const bags = writablePropertyBags(item);
  if (bags.length === 0) {
    return false;
  }
  for (const props of bags) {
    const current = parseCssClasses(props[CSS_CLASSES_PROPERTY]);
    const next = on
      ? current.includes(name)
        ? current
        : [...current, name]
      : current.filter((entry) => entry !== name);
    props[CSS_CLASSES_PROPERTY] = next;
  }
  if (options.deferNotify) {
    // Everything that would make FORMCYCLE re-render the cell is postponed — including re-pushing the
    // value into the designer's own `cssclasses` editor, whose `setValue` fires the property callback.
    pendingCssClassEditorItem = item;
    return true;
  }
  notifyAttributeChange();
  // A standard-configuration class influences the rendered widget, so refresh a running preview.
  scheduleRefresh();
  refreshCssClassesEditor(item);
  return true;
}

/**
 * Flushes what {@link setElementCssClass} postpones with `options.deferNotify`: the designer's
 * `cssclasses` editor value, the persist-differ nudge (which syncs the changed draft) and the debounced
 * badge/preview refresh.
 *
 * Used by the element CodBi panel when a class was written while the "activate this standard
 * configuration?" question was OPEN — the canvas must not be rebuilt under the modal, but the change
 * still has to reach the server (and the running preview) once the question is answered.
 *
 * @param options `refreshPreview: false` only nudges the persist differ (so the class is saved) and
 *   skips everything that makes FORMCYCLE re-render the cell — the canvas then simply keeps showing
 *   the previous preview. Used when the question is DISMISSED: the user declined, so nothing should be
 *   re-actualised.
 */
export function flushElementCssClassChange(options: { refreshPreview?: boolean } = {}): void {
  const pending = pendingCssClassEditorItem;
  pendingCssClassEditorItem = null;
  const refreshPreview = options.refreshPreview !== false;
  if (pending && refreshPreview) {
    refreshCssClassesEditor(pending);
  }
  notifyAttributeChange();
  if (refreshPreview) {
    scheduleRefresh();
  }
}

/**
 * Re-pushes the item's `cssclasses` into the designer's own (mounted) CSS-classes editor so its
 * visible field matches the model after a direct {@link setElementCssClass} mutation. Only the
 * SELECTED item's editor is bound (the grid is shared), so this is a no-op for any other item; it is
 * also a no-op when that editor is not currently mounted — the change is already in the persisted
 * property bags and is synced by the differ.
 */
function refreshCssClassesEditor(item: IMarkerItemLike): void {
  try {
    const selected = designerInstance()?.getSelectedMasterItem?.() === item;
    if (!selected) {
      return;
    }
    const editor = findPropertyEditor(CSS_CLASSES_PROPERTY);
    if (!editor?.setValue) {
      return;
    }
    const value = parseCssClasses(propertiesOf(item)?.[CSS_CLASSES_PROPERTY]);
    editor.setValue(value);
  } catch (x) {
    console.warn("[CodBi] Element markers: could not refresh the CSS-classes editor", x);
  }
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
 * The anchor in the designer is the item's CONTENT CELL (a wrapper such as `<td class="xm-item-content">`),
 * NOT the inner form `<input>`/`<fieldset>` the runtime selectors actually target. So besides testing
 * the anchor itself we also test the form control the item RENDERS — which is what makes selectors
 * like `input[data-datepicker="1"]`, `input[data-vdt="time"]`, `input[type="text"]` and `fieldset:…`
 * resolve against the real widget even when the anchor is the wrapper cell.
 *
 * Crucially a PAGE or CONTAINER cell contains the cells of its CHILD items, so a control of a child
 * must never make the page look targeted: probing the plain first descendant made a page carry the
 * green badge of e.g. `Holistic.Media.MultipleUpload` (whose targets are the upload FIELDS inside it)
 * although the runtime never applies it to the page. Child items are recognised by their own
 * `xm-item-container`, and controls living inside one are skipped — while the container's OWN
 * rendered element (e.g. the item's `<fieldset>`, targeted by `Holistic.FieldsetsToPanel`) is still
 * considered, because it sits inside ITS container, not inside a child one.
 */
export function holisticTargetsAnchor(anchor: HTMLElement, targets: string): boolean {
  if (!anchor || !targets) {
    return false;
  }
  // The candidate elements to test: the anchor itself plus the form controls the item OWNS.
  const candidates: HTMLElement[] = [anchor];
  for (const inner of holisticOwnControls(anchor)) {
    if (!candidates.includes(inner)) {
      candidates.push(inner);
    }
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

/** The designer's per-item container table (a nested one belongs to a CHILD item of the anchor). */
const NESTED_ITEM_CONTAINER_SELECTOR = "table.xm-item-container, .xm-item-container";

/**
 * The form controls the anchor item itself renders — i.e. excluding every control that belongs to a
 * NESTED (child) item. A leaf widget yields its own input(s)/textarea/select/fieldset; a page or
 * container yields only the controls that are part of its own rendered element.
 *
 * @param anchor The item's content cell.
 * @returns The controls owned by this item (possibly empty for a page/container).
 */
function holisticOwnControls(anchor: HTMLElement): HTMLElement[] {
  const probe =
    "input[type], textarea, select, fieldset, input, [role='presentation'] input, .xm-item-div input, .xm-item-div fieldset";
  let found: Element[] = [];
  try {
    found = Array.from(anchor.querySelectorAll(probe));
  } catch {
    return [];
  }
  const own: HTMLElement[] = [];
  for (const candidate of found) {
    if (!(candidate instanceof HTMLElement)) {
      continue;
    }
    let owner: Element | null = null;
    try {
      owner = candidate.closest(NESTED_ITEM_CONTAINER_SELECTOR);
    } catch {
      owner = null;
    }
    // A container INSIDE the anchor is a child item's: the control belongs to that child, not here.
    if (owner && owner !== anchor && anchor.contains(owner)) {
      continue;
    }
    own.push(candidate);
  }
  return own;
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
 * {@link ensureElementPreviewSwitch}. Elements that carry a persisted `data-cb-preview="1"`
 * additionally show their switch even when this form-level mode is OFF (see `refreshBadges`), so a
 * per-element preview survives a designer reload on its own.
 */
function previewElementsEnabled(): boolean {
  // The switch is authoritative while mounted: the persisted form-property model is not reliably
  // updated by a custom editor (the same rationale as `isMarkEnabled`).
  if (previewSwitchEnabled !== null) {
    return previewSwitchEnabled;
  }
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

/**
 * Reads an element's persisted `data-cb-preview` toggle from its attribute bag. This attribute is the
 * single source of truth for the per-element preview, so it also restores the toggle after a reload.
 * `"true"` is accepted alongside `"1"` (e.g. when the attribute was set by hand in the attributes
 * table); an absent attribute or `"0"` means off.
 */
function elementPreviewOn(item: IMarkerItemLike): boolean {
  const value = attributeValue(attributeEntries(item), ELEMENT_PREVIEW_ATTRIBUTE).toLowerCase();
  return value === "1" || value === "true";
}

/**
 * Forces a FRESH render of every per-element preview nested INSIDE `parentAnchor` (a page's or
 * container's preview) that is still switched on. Closing a parent preview makes its child elements
 * visible again, but a child iframe that was applied while the parent preview hid it can remain
 * unclipped (showing the WHOLE page instead of the element). Dropping the applied signatures and
 * re-applying the preview reloads the iframe and re-runs {@link clipPreviewToElement}, so the child
 * keeps its preview — correctly clipped to the child element.
 *
 * Only called when the user explicitly switches a preview OFF (never during the periodic
 * `refreshBadges` pass), so independently enabled previews are never lost on an unrelated refresh.
 */
function refreshNestedPreviews(parent: IMarkerItemLike, parentAnchor: HTMLElement): void {
  try {
    // Drop every preview iframe inside the closed parent first: this removes both the parent's own
    // (about to be cleared) frame and any stale, unclipped child frame that currently shows the
    // whole page. Each still-enabled child re-creates its frame below.
    for (const frame of Array.from(parentAnchor.querySelectorAll<HTMLIFrameElement>(".codbi-func-preview-frame"))) {
      frame.remove();
    }

    const items = designerInstance()?.items ?? {};
    for (const other of Object.values(items)) {
      if (other === parent) {
        continue;
      }
      const otherAnchor = anchorFor(other);
      if (!otherAnchor || otherAnchor === parentAnchor || !parentAnchor.contains(otherAnchor)) {
        continue;
      }
      if (!elementPreviewOn(other)) {
        continue;
      }
      const otherId = other.getId?.() ?? "";
      cancelScheduledPreviewReapply(otherAnchor);
      previewApplied.delete(otherAnchor);
      if (otherId) {
        previewAppliedById.delete(otherId);
      }
      applyElementPreview(other, otherAnchor, true);
    }
  } catch (x) {
    console.warn("[CodBi] Preview: could not refresh the nested element previews", x);
  }
}

/**
 * Signature of everything that influences an element's frontend preview: its identity PLUS every
 * `data-cb-*` attribute (the functionality list and its parameters) and its CSS classes (CodBi
 * standard configurations). The preview CONTROL attribute `data-cb-preview` is excluded — flipping
 * the preview switch itself must not force an extra reload. When a `data-cb-*` attribute changes,
 * the signature changes and the running preview is re-applied, so parameter edits actually reach the
 * rendered widget.
 */
function elementPreviewSignature(item: IMarkerItemLike): string {
  const id = item.getId?.() ?? "";
  const parts: string[] = [];
  for (const attr of attributeEntries(item)) {
    const name = String(attr?.text ?? "")
      .trim()
      .toLowerCase();
    if (!name.startsWith(CB_PARAM_PREFIX) || name === ELEMENT_PREVIEW_ATTRIBUTE) {
      continue;
    }
    parts.push(`${name}\u0003${String(attr?.value ?? "").trim()}`);
  }
  parts.sort();
  const cssClasses = parseCssClasses(propertiesOf(item)?.[CSS_CLASSES_PROPERTY]).sort();
  // The form-level revision makes a running preview reload after a change that is NOT visible on the
  // element itself: a form global variable (fed into the CodBi parameters) or the activation state of
  // a (holistic) standard configuration in the CodBi form options.
  return `elem\u0001${id}\u0001${parts.join("\u0002")}\u0001${cssClasses.join("\u0002")}\u0001${formPreviewRevision}`;
}

/** Cancels a pending debounced re-apply of a running element preview. */
function cancelScheduledPreviewReapply(anchor: HTMLElement): void {
  const handle = previewReapplyTimers.get(anchor);
  if (handle !== undefined) {
    window.clearTimeout(handle);
    previewReapplyTimers.delete(anchor);
  }
}

/**
 * Debounces a re-apply of a RUNNING element preview after the element's `data-cb-*` attributes
 * changed. The preview page renders the server-side draft, and the designer syncs attribute changes
 * with a delay, so the iframe is reloaded only after {@link PREVIEW_REAPPLY_DELAY_MS} — reloading
 * immediately would render the old values. The timer resolves the LIVE item and re-computes the
 * signature when it fires, so it always reloads with the newest values. Only one timer per wrapper
 * is kept; additional refreshes do not postpone it.
 */
function schedulePreviewReapply(anchor: HTMLElement, item: IMarkerItemLike): void {
  if (previewReapplyTimers.has(anchor)) {
    return;
  }
  const handle = window.setTimeout(() => {
    previewReapplyTimers.delete(anchor);
    try {
      if (!anchor.isConnected) {
        return;
      }
      // A modal question is open: keep the preview untouched (the resume does a coalesced refresh, which
      // re-derives this very re-apply with the then-current signature).
      if (elementPreviewsSuspended()) {
        return;
      }
      const id = item.getId?.() ?? "";
      const live = resolveFuncItem(id, anchor, item);
      const signature = elementPreviewSignature(live);
      if (previewApplied.get(anchor) === signature) {
        return;
      }
      // Drop the stale signature so `renderServerPreview` reloads the iframe with the synced draft.
      previewApplied.delete(anchor);
      if (elementPreviewOn(live)) {
        void renderServerPreview(anchor, live, signature);
      } else {
        clearServerPreview(anchor);
      }
    } catch (x) {
      console.error("[CodBi] Preview: could not refresh the element preview", x);
    }
  }, PREVIEW_REAPPLY_DELAY_MS);
  previewReapplyTimers.set(anchor, handle);
}

/**
 * Applies/removes the **per-element** frontend preview of an arbitrary element. It reuses
 * {@link renderServerPreview} to load a genuine form instance into a hidden same-origin iframe,
 * which is then clipped to THIS element via its item id.
 */
function applyElementPreview(item: IMarkerItemLike, anchor: HTMLElement, on: boolean): void {
  try {
    const id = item.getId?.() ?? "";
    anchor.classList.toggle(ELEM_PREVIEW_CLASS, on);
    // The preview SWITCH is always reflected (the class above), but no preview is (re)built or torn down
    // while a modal question is open — see {@link suspendElementPreviews}.
    if (elementPreviewsSuspended() && on) {
      return;
    }
    if (!on) {
      cancelScheduledPreviewReapply(anchor);
      previewApplied.delete(anchor);
      if (id) {
        previewAppliedById.delete(id);
      }
      clearServerPreview(anchor);
      return;
    }
    const signature = elementPreviewSignature(item);
    const previous = previewApplied.get(anchor);
    // A signature match only means "applied" while the preview iframe is STILL THERE. The designer
    // re-renders an element cell IN PLACE, which drops our iframe but keeps the cell element — and
    // with it the `--rendered` class that hides the native element — so treating the stale signature
    // as "already applied" left the cell permanently blank: no iframe, hidden content, no reload.
    const hasFrame = anchor.querySelector(":scope > .codbi-func-preview-frame") !== null;
    if (previous === signature) {
      if (hasFrame) {
        return;
      }
      // Same content, but the rendered DOM (with our iframe) was replaced → rebuild right away; there
      // is nothing to sync, so the draft-sync delay of the reapply path does not apply.
      previewApplied.delete(anchor);
      previewAppliedById.delete(id);
      void renderServerPreview(anchor, item, signature);
      return;
    }
    // A preview is already running on this anchor, OR the element was previewed before and the
    // designer re-rendered the anchor after a property edit (so the WeakMap no longer knows it):
    // in both cases the attributes changed and we must wait for the draft sync before reloading.
    const previouslyApplied = previous ?? previewAppliedById.get(id);
    if (previouslyApplied !== undefined) {
      schedulePreviewReapply(anchor, item);
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
 * attribute (written onto the element itself via {@link setItemAttributeValue}). That attribute is
 * the **only** persistence for this setting: it is stored with the element by the designer, so on a
 * reload `refreshBadges` re-creates the switch and re-applies the preview from it.
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
      // The badge can outlive the Item instance it was built for (the designer replaces its items
      // on re-render), leaving the captured instance with a detached property bag. Resolve the LIVE
      // item before reading/writing so the toggle lands in the persisted model.
      const live = resolveFuncItem(id, anchor, item);
      const current = elementPreviewOn(live);
      // Write the toggle onto the element's own attribute bag; the designer re-renders and
      // refreshBadges re-applies the preview (and the `after-set-property` callback refreshes).
      // `data-cb-preview` is the ONLY persistence for this setting — nothing else is written.
      setItemAttributeValue(live, ELEMENT_PREVIEW_ATTRIBUTE, current ? "0" : "1");
      // Closing a page/container preview re-clips every preview nested inside it, so a child
      // preview that was applied while the parent preview hid it does not keep showing the whole
      // page (its own preview switch stays ON — see above).
      if (current) {
        refreshNestedPreviews(live, anchor);
      }
      scheduleRefresh();
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
/**
 * Minimum time between two reloads of the SAME preview iframe.
 *
 * A reload is expensive (the whole designer-preview page renders the form) and it can be requested from
 * several places at once: an attribute change, the form-level revision, the designer re-rendering the
 * cell and our own `resize`. Each reload resets the iframe to 360px and restarts the clip/fit loop, so
 * an unthrottled burst compounds into a permanently broken cell — earlier reload requests are postponed
 * instead of dropped.
 */
const MIN_PREVIEW_RELOAD_INTERVAL_MS = 1500;

/** Timestamp of the last reload per preview iframe (see {@link MIN_PREVIEW_RELOAD_INTERVAL_MS}). */
const previewLastReload = new WeakMap<HTMLIFrameElement, number>();

/**
 * The single queued retry of a postponed reload per preview iframe.
 *
 * At most ONE retry is queued: a burst of requests must not queue a burst of retries that then all fire
 * together — each retry resets the iframe again, so a pile-up reproduces exactly the breakage the burst
 * guard exists to prevent.
 */
const previewPostponedRetry = new WeakMap<HTMLIFrameElement, number>();

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
    // #region Burst guard — MUST run before ANY state is touched.
    // A reload request can arrive several times at once (attribute change, form revision, the designer
    // re-rendering the cell, our own `resize`). Postponing it AFTER resetting the iframe would leave the
    // cell broken until the postponed call runs: the iframe was already shrunk to 360px, the height pin
    // released, the fit record dropped and — worse — the clip generation bumped with `previewClipLoops`
    // still marked alive, so even the self-healing pass would not restart the loop. That is exactly why
    // the preview was wrecked immediately whenever the (slow) DevTools console produced more bursts.
    const now = Date.now();
    const lastReload = previewLastReload.get(target) ?? 0;
    if (now - lastReload < MIN_PREVIEW_RELOAD_INTERVAL_MS) {
      const wait = MIN_PREVIEW_RELOAD_INTERVAL_MS - (now - lastReload);
      // Only ONE retry per iframe: a burst of requests must not queue a burst of retries that then fire
      // together (each of them would reset the iframe again).
      if (previewPostponedRetry.has(target)) {
        return;
      }
      const retry = window.setTimeout(() => {
        previewPostponedRetry.delete(target);
        if (target.isConnected && wrapper.isConnected) {
          void renderServerPreview(wrapper, child, signature);
          return;
        }
        // The designer re-rendered the cell while the request was queued: the captured wrapper is
        // detached, so a direct reload would be a silent no-op. Re-resolve the CURRENT anchor instead —
        // without this the cell could stay broken (360px iframe, no pin) forever.
        previewApplied.delete(wrapper);
        scheduleRefresh();
      }, wait);
      previewPostponedRetry.set(target, retry);
      return;
    }
    previewLastReload.set(target, now);
    // #endregion
    // Every (re)pointing starts a NEW clip/fit generation, so the loop of the PREVIOUS load stops
    // instead of continuing to clip the reloaded document. Without this each re-apply started yet
    // another 16-step fit loop on the same frame; the loops accumulated and each step dispatches
    // `resize` (which makes FORMCYCLE re-measure its cells), so the FIRST preview looked right while
    // every later refresh left the cell clipped and the platform's own preview chrome visible.
    const generation = nextPreviewClipGeneration(target);
    // The loop counts as alive from the moment it is registered (not from its first step), so a refresh
    // that lands while the preview is still LOADING does not start a competing loop.
    previewClipLoops.set(target, true);
    // The preview page renders the form asynchronously, so the element may appear AFTER `load`.
    target.addEventListener("load", () => scheduleClip(target, elementRef, 0, 0, generation), { once: true });
    // A failed request (e.g. an HTTP 404 because the derived URL is wrong on a live server) fires the
    // `error` event on the iframe — log the exact URL that was requested so the 404 is diagnosable.
    target.addEventListener(
      "error",
      () => console.error("[CodBi] Preview: iframe failed to load (HTTP error/404?) for URL=%s", target.src),
      { once: true },
    );
    // Cache-busting key: a re-apply after an attribute change must fetch the freshly synced DRAFT
    // instead of reusing an already loaded/cached document for the same URL.
    const separator = url.includes("?") ? "&" : "?";
    const fullUrl = `${url}${separator}_cbref=${Date.now()}`;
    // A previous load may have been collapsed because the element could not be located — restore the
    // iframe before (re)pointing it at the preview so a later successful clip is actually visible.
    target.style.visibility = "";
    target.style.height = "360px";
    // Drop a height pin left over from the PREVIOUS preview of this element: the pin belongs to the old
    // content, and until the re-fit measures the reloaded preview it would clip it (too short) or leave
    // a gaping area (too tall). It is re-applied by `fitPreviewHeight` once the element is there.
    clearPreviewWrapperHeight(wrapper);
    // The fit record (and a pending debounced fit) belongs to the OLD document as well — and the
    // remembered height is reset so the first fit of the new document dispatches `resize` again.
    unregisterPreviewFit(target);
    delete target.dataset.codbiFitHeight;
    target.src = fullUrl;
    wrapper.classList.add("codbi-func-preview--rendered");
    // Mark applied only once the iframe is pointed at the preview (a re-enable with the same target
    // skips the reload; changing the contained element changes the signature and reloads).
    previewApplied.set(wrapper, signature);
    // Remember the signature by ITEM id too, so a later anchor re-render still recognises that this
    // element was previewed before and can tell an attribute change from a first activation.
    const previewItemId = child?.getId?.() ?? "";
    if (previewItemId) {
      previewAppliedById.set(previewItemId, signature);
    }
  } catch (x) {
    console.error("[CodBi] Preview: form preview failed", x);
  }
}

/**
 * Maximum number of polling attempts while waiting for the element to appear in the preview
 * document (250 ms each ≈ 15 s). Slow form renders (large forms, many functionalities) used to give
 * up after ~4 s and then rendered the WHOLE form — see {@link collapseUnresolvedPreview}.
 */
const PREVIEW_CLIP_MAX_ATTEMPTS = 60;

/** How often a SUCCESSFUL clip is re-fitted (500 ms apart) so late-mounting editors settle. */
const PREVIEW_CLIP_REFITS = 16;

/**
 * Generation counter per preview iframe, bumped every time the iframe is (re)pointed at a preview.
 *
 * A clip/fit loop belongs to exactly ONE load: without the counter every re-apply started ANOTHER
 * 16-step loop on the same frame and the loops accumulated. Each step dispatches `resize`, which makes
 * FORMCYCLE re-measure its cells, so repeated refreshes thrashed the canvas — the first preview was
 * correct and every later one ended up clipped with the platform's own preview chrome visible.
 */
const previewClipGenerations = new WeakMap<HTMLIFrameElement, number>();

/**
 * Starts a new clip/fit generation for [frame].
 *
 * @param frame The preview iframe that is about to be (re)pointed at a preview.
 * @returns The generation id the new loop has to carry.
 */
function nextPreviewClipGeneration(frame: HTMLIFrameElement): number {
  const next = (previewClipGenerations.get(frame) ?? 0) + 1;
  previewClipGenerations.set(frame, next);
  return next;
}

/**
 * Whether a clip/fit loop is currently alive for an iframe.
 *
 * A loop can end without completing — the preview was reloaded (new generation), the frame was removed,
 * or the clip could not locate the element within the polling budget. The iframe then stays at its
 * initial `360px`, while the cell keeps a `minHeight` pin from a previous, taller preview: the widget
 * shows a large empty box and a clipped preview. {@link healRunningPreviews} restarts such a loop (and
 * reconciles the pin) on the next refresh, so a stuck preview repairs itself instead of staying broken
 * until the element is toggled.
 */
const previewClipLoops = new WeakMap<HTMLIFrameElement, boolean>();

/**
 * Keeps the preview fitted to the element: retries until the element exists, then re-fits a few more
 * times AFTER success, because a functionality (e.g. `HTML.Input.TinyMCE`) mounts its editor
 * asynchronously AFTER the form rendered and thereby changes the element's height (and the preview
 * chrome settles late).
 *
 * While element previews are SUSPENDED (a modal question is open) every step is postponed instead of
 * dropped: the fitting dispatches `resize`, which makes FORMCYCLE re-measure its cells and thereby
 * rebuild the preview under the modal — and a preview rebuilt mid-question comes back clipped with the
 * platform's own preview chrome visible.
 */
function scheduleClip(
  frame: HTMLIFrameElement,
  elementRef: string,
  attempts = 0,
  fits = 0,
  generation = previewClipGenerations.get(frame) ?? 0,
): void {
  // The iframe was removed (the designer re-rendered the cell, or the preview was switched off) …
  if (!frame.isConnected) {
    previewClipLoops.set(frame, false);
    return;
  }
  // … or a NEWER load replaced the document this loop was started for: a stale loop must never touch
  // the reloaded preview (it would clip it to the OLD element and keep dispatching `resize`).
  if ((previewClipGenerations.get(frame) ?? 0) !== generation) {
    previewClipLoops.set(frame, false);
    return;
  }
  // Marks the loop as alive; every terminal path clears it again (see {@link previewClipLoops}).
  previewClipLoops.set(frame, true);
  if (elementPreviewsSuspended()) {
    window.setTimeout(() => scheduleClip(frame, elementRef, attempts, fits, generation), 250);
    return;
  }
  const ok = clipPreviewToElement(frame, elementRef);
  if (ok) {
    // Re-fit after success so late-mounting editors (TinyMCE) and settling preview chrome are
    // reflected in the iframe height.
    if (fits < PREVIEW_CLIP_REFITS) {
      window.setTimeout(() => scheduleClip(frame, elementRef, attempts + 1, fits + 1, generation), 500);
    }
    return;
  }
  if (attempts >= PREVIEW_CLIP_MAX_ATTEMPTS) {
    previewClipLoops.set(frame, false);
    collapseUnresolvedPreview(frame);
    return;
  }
  window.setTimeout(() => scheduleClip(frame, elementRef, attempts + 1, fits, generation), 250);
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

/** Rich-text editor containers mounted by the `HTML.Input.TinyMCE` functionality. */
const PREVIEW_EDITOR_SELECTOR = ".tox-tinymce, .mce-tinymce, .tox-editor-container";

/**
 * The rich-text editor that BELONGS to [el] — never the editor of a DIFFERENT form element.
 *
 * TinyMCE inserts its container as a sibling of the tagged `<textarea>` (inside the same field
 * wrapper), so a document-wide `querySelector` found the editor of ANY TinyMCE element on the form.
 * `resolveItemWrapper` then climbed to the OUTERMOST ancestor containing that unrelated editor —
 * i.e. the page/form wrapper — and the preview rendered the ENTIRE form instead of the single
 * element. This only showed up once the TinyMCE editor mounted asynchronously after the form
 * rendered, which is why a persistent preview switch sometimes "rendered as the whole form".
 *
 * The lookup is therefore scoped: the editor must be a DESCENDANT of [el] (when [el] is the item
 * wrapper) or a DIRECT child of [el]'s parent — the field's own `.xm-item-div` wrapper, which holds
 * both the tagged control and the editor TinyMCE inserts next to it.
 */
function findOwnEditor(el: HTMLElement): HTMLElement | null {
  const inside = el.querySelector<HTMLElement>(PREVIEW_EDITOR_SELECTOR);
  if (inside) {
    return inside;
  }
  const parent = el.parentElement;
  if (!parent) {
    return null;
  }
  for (const sibling of Array.from(parent.children)) {
    if (sibling === el) {
      continue;
    }
    if ((sibling as HTMLElement).matches(PREVIEW_EDITOR_SELECTOR)) {
      return sibling as HTMLElement;
    }
  }
  return null;
}

/**
 * Resolves the single-element FORMCYCLE "item wrapper" for [el]: the node that represents ONE form
 * element (as opposed to the whole form).
 *
 * - If the element has its OWN rich-text editor (TinyMCE → `.tox-tinymce`), the wrapper is the
 *   CLOSEST ancestor that contains both the tagged node and that editor — never the bare
 *   `<textarea>` (the editor is a sibling, so treating the textarea as the wrapper hid the editor and
 *   collapsed the height to 0) and never a higher ancestor (that would include sibling elements and
 *   render more than the one element).
 * - Otherwise the nearest ancestor/self with an item class (`.XItem` / `xm-item…`), skipping form
 *   controls (the field itself carries `XItem XTextArea`, which would otherwise win).
 */
function resolveItemWrapper(el: HTMLElement, owner: Document): HTMLElement | null {
  const editor = findOwnEditor(el);
  if (editor) {
    for (let n: HTMLElement | null = el; n && n !== owner.body; n = n.parentElement) {
      if (n.contains(editor) && !isFormControl(n)) {
        return n;
      }
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

/**
 * Delay before the clip of a running preview is re-applied after its document re-rendered.
 *
 * The platform preview page inside the iframe re-renders the form when the draft changes — which is
 * exactly what selecting a standard configuration does — and that re-render replaces the nodes whose
 * siblings we had hidden, so the preview shows the WHOLE form page (with FORMCYCLE's preview tools)
 * again. A small delay lets the re-render settle before we clip the fresh DOM.
 */
const PREVIEW_RECLIP_DELAY_MS = 250;

/** One active preview iframe + the element it shows, for pop-up-aware re-fitting and re-clipping. */
interface IPreviewFit {
  frame: HTMLIFrameElement;
  owner: Document;
  item: HTMLElement;
  /** The designer element ref the preview is clipped to (`clipPreviewToElement`). */
  elementRef: string;
  timer?: number;
  reclipTimer?: number;
  /** `true` while a clip is being applied — our own clip mutations must not trigger a re-clip. */
  clipping?: boolean;
  /** Failed re-clip attempts since the last success (see {@link scheduleReclip}). */
  reclipAttempts?: number;
}

/** Active previews (re-fitted whenever the preview document mutates). */
const previewFits = new Set<IPreviewFit>();
/** Preview documents already observed (install the MutationObserver at most once per document). */
const observedPreviewDocs = new WeakSet<Document>();

/** Registers/updates the fit record for [frame] and returns it. */
function registerPreviewFit(
  frame: HTMLIFrameElement,
  owner: Document,
  item: HTMLElement,
  elementRef: string,
): IPreviewFit {
  for (const entry of previewFits) {
    if (entry.frame === frame) {
      entry.owner = owner;
      entry.item = item;
      entry.elementRef = elementRef;
      entry.reclipAttempts = 0;
      startPreviewWatchdog();
      return entry;
    }
  }
  const entry: IPreviewFit = { frame, owner, item, elementRef };
  previewFits.add(entry);
  startPreviewWatchdog();
  return entry;
}

/** Unregisters the fit record of [frame] (called when the preview iframe is removed). */
function unregisterPreviewFit(frame: HTMLIFrameElement): void {
  for (const entry of Array.from(previewFits)) {
    if (entry.frame === frame) {
      if (entry.timer !== undefined) {
        window.clearTimeout(entry.timer);
      }
      if (entry.reclipTimer !== undefined) {
        window.clearTimeout(entry.reclipTimer);
      }
      previewFits.delete(entry);
    }
  }
}

/**
 * @param frame - A preview iframe.
 * @param clippedItem - The element the preview was clipped to (as returned by the last clip).
 * @returns `true` when that element is no longer part of the preview document, i.e. the document
 * re-rendered the form underneath us and the clip (the hidden siblings + hidden preview chrome) is
 * gone — the preview then shows the WHOLE form page again.
 *
 * Exported so the watchdog's decision can be unit-tested without a live platform preview page.
 */
export function previewClipIsLost(frame: HTMLIFrameElement, clippedItem: HTMLElement | null | undefined): boolean {
  if (!clippedItem) {
    return false;
  }
  const cdoc = frame.contentDocument;
  if (!cdoc?.body) {
    return false;
  }
  return !cdoc.contains(clippedItem);
}

/**
 * Re-applies the CLIP of a running preview whose clipped element is GONE from the preview document —
 * the signature of the preview page having re-rendered the form.
 *
 * Switching ONE element's preview on and off never breaks: that path always creates a FRESH iframe and
 * clips it from scratch. A re-render inside a live iframe is the case that used to leave the whole
 * form page (and its preview tools) visible, so this runs from the preview document's observer AND
 * from every refresh pass.
 *
 * @param entry - The preview to check.
 * @returns `true` when a re-clip was performed.
 */
function reclipIfDetached(entry: IPreviewFit): boolean {
  if (entry.clipping || !entry.frame.isConnected) {
    return false;
  }
  // The preview page may have NAVIGATED (its own reload), which swaps the whole document: the
  // observer then sits on a dead document and would never fire again. Re-observe the new one.
  const cdoc = entry.frame.contentDocument;
  if (cdoc && cdoc !== entry.owner) {
    entry.owner = cdoc;
    observePreview(cdoc);
  }
  if (!previewClipIsLost(entry.frame, entry.item)) {
    return false;
  }
  entry.clipping = true;
  // Hide the iframe while re-clipping: the page currently shows the WHOLE form (the re-render wiped
  // the hidden siblings), and the user must not see that flash.
  entry.frame.style.visibility = "hidden";
  try {
    return clipPreviewToElement(entry.frame, entry.elementRef);
  } finally {
    entry.clipping = false;
  }
}

/** Debounced {@link reclipIfDetached} (called from the preview document's DOM observer). */
function scheduleReclip(entry: IPreviewFit): void {
  if (entry.clipping || entry.reclipTimer !== undefined) {
    return;
  }
  entry.reclipTimer = window.setTimeout(() => {
    entry.reclipTimer = undefined;
    if (!entry.frame.isConnected) {
      unregisterPreviewFit(entry.frame);
      return;
    }
    if (reclipIfDetached(entry)) {
      return;
    }
    // The element is still missing: retry a few times (the re-render may not be finished), then give
    // up so a deleted element cannot keep the loop alive.
    if (!previewClipIsLost(entry.frame, entry.item)) {
      return;
    }
    entry.reclipAttempts = (entry.reclipAttempts ?? 0) + 1;
    if (entry.reclipAttempts <= 10) {
      scheduleReclip(entry);
    } else {
      collapseUnresolvedPreview(entry.frame);
    }
  }, PREVIEW_RECLIP_DELAY_MS);
}

/** Re-clips every running preview whose clipped element disappeared from its document. */
function resyncDetachedPreviewClips(): void {
  for (const entry of Array.from(previewFits)) {
    if (!reclipIfDetached(entry) && previewClipIsLost(entry.frame, entry.item)) {
      // Still lost (the page is still rendering) — keep a retry alive instead of leaving the cell
      // hidden until the next user interaction.
      scheduleReclip(entry);
    }
  }
}

/**
 * Interval of the preview watchdog (see {@link startPreviewWatchdog}).
 *
 * The preview page renders PROGRESSIVELY and re-renders itself whenever the draft changes — also late,
 * when no designer event fires any more. Such a late re-render throws the clip away, so a slow safety
 * net re-checks the running previews instead of waiting for the next user interaction.
 */
const PREVIEW_WATCHDOG_INTERVAL_MS = 1000;

/** Handle of the running watchdog interval, `null` while stopped. */
let previewWatchdogHandle: number | null = null;

/** Starts the preview watchdog (idempotent); it stops itself once no preview is running. */
function startPreviewWatchdog(): void {
  if (previewWatchdogHandle !== null) {
    return;
  }
  previewWatchdogHandle = window.setInterval(() => {
    if (previewFits.size === 0) {
      if (previewWatchdogHandle !== null) {
        window.clearInterval(previewWatchdogHandle);
        previewWatchdogHandle = null;
      }
      return;
    }
    resyncDetachedPreviewClips();
  }, PREVIEW_WATCHDOG_INTERVAL_MS);
}

/** Debounced re-fit of one preview (called from the DOM observer). */
function scheduleFit(entry: IPreviewFit): void {
  if (entry.timer !== undefined) {
    window.clearTimeout(entry.timer);
  }
  entry.timer = window.setTimeout(() => {
    entry.timer = undefined;
    // The designer re-renders cells itself (removing our iframe with them): a dead frame must not be
    // re-fitted — that would dispatch `resize` for a preview that no longer exists.
    if (!entry.frame.isConnected) {
      unregisterPreviewFit(entry.frame);
      return;
    }
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
        if (entry.owner !== owner) {
          continue;
        }
        scheduleFit(entry);
        // The preview page re-renders the form itself when the draft changes (a standard-configuration
        // selection does exactly that) and drops the nodes we had hidden — see scheduleReclip.
        scheduleReclip(entry);
      }
    });
    // Observe the DOCUMENT ELEMENT, not the body: a re-render may replace the whole body node, and an
    // observer on the old body would then never fire again.
    observer.observe(owner.documentElement, { childList: true, subtree: true });
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
  // editor takes over, so the item's own rect alone would be too small. Only THIS element's own
  // editor counts — another element's editor must not inflate (or reveal) the preview.
  const editor = findOwnEditor(item);
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
  const unchanged = frame.dataset.codbiFitHeight === String(height);
  frame.style.height = `${height}px`;
  applyPreviewWrapperHeight(frame, height);
  // Ask the designer to recompute the item layout so the item grows to the iframe's new height — but
  // ONLY when the height really changed. The fit runs up to 1 + {@link PREVIEW_CLIP_REFITS} times per
  // apply; dispatching `resize` on every one of them made FORMCYCLE re-measure its cells again and
  // again, which is what wrecked the canvas on repeated preview refreshes.
  if (!unchanged) {
    frame.dataset.codbiFitHeight = String(height);
    try {
      window.dispatchEvent(new Event("resize"));
    } catch {
      /* ignore */
    }
  }
  return height;
}

/**
 * Pins the fitted PREVIEW height on the preview wrapper (the element's own designer cell).
 *
 * The preview iframe carries an explicit height, but FORMCYCLE's designer re-measures a cell from its
 * children whenever it re-renders — e.g. when the user switches to the workflow designer and back.
 * Our own preview CSS hides those children, so that re-measurement restored the element's NATIVE
 * (shorter) height and the taller preview was CUT OFF, although the preview switch was still on.
 * Mirroring the fitted height onto the wrapper as `minHeight` makes the cell keep the preview height
 * for as long as the preview runs; {@link clearPreviewWrapperHeight} removes it again when the
 * preview is switched off, so an element always returns to its native height.
 */
function applyPreviewWrapperHeight(frame: HTMLIFrameElement, height: number): void {
  const wrapper = frame.parentElement;
  if (!wrapper || height <= 0) {
    return;
  }
  wrapper.style.minHeight = `${height}px`;
  wrapper.dataset.codbiPreviewHeight = String(height);
  pinnedPreviewWrappers.add(wrapper);
}

/** Drops the preview-height pinning from a wrapper (see {@link applyPreviewWrapperHeight}). */
function clearPreviewWrapperHeight(wrapper: HTMLElement | null): void {
  if (!wrapper) {
    return;
  }
  wrapper.style.minHeight = "";
  delete wrapper.dataset.codbiPreviewHeight;
  pinnedPreviewWrappers.delete(wrapper);
}

/**
 * Wrappers that currently carry a preview height pin (see {@link applyPreviewWrapperHeight}).
 *
 * The pin must live exactly as long as the preview it belongs to. FORMCYCLE re-renders element cells
 * IN PLACE, so a pin survived the removal/replacement of the preview inside it and every further
 * refresh pinned yet another cell — after two or three refreshes the canvas layout was visibly wrong
 * (tall gaps, wrongly clipped boxes). {@link prunePreviewPins} keeps the pins in sync with the
 * previews that really exist.
 */
const pinnedPreviewWrappers = new Set<HTMLElement>();

/**
 * Releases every preview height pin that no longer belongs to a live preview: the wrapper was removed
 * (the designer re-rendered the cell) or the preview iframe inside it is gone. Called from
 * {@link refreshBadges}, so any refresh re-establishes a consistent layout instead of accumulating
 * stale pins.
 *
 * The fit records are pruned the same way: a frame the designer removed must not keep a debounced fit
 * alive, because that fit dispatches `resize` and makes FORMCYCLE re-measure cells for a preview that no
 * longer exists.
 */
function prunePreviewPins(): void {
  for (const wrapper of Array.from(pinnedPreviewWrappers)) {
    const hasFrame = wrapper.querySelector(":scope > .codbi-func-preview-frame") !== null;
    if (!wrapper.isConnected || !hasFrame) {
      clearPreviewWrapperHeight(wrapper);
    }
  }
  for (const entry of Array.from(previewFits)) {
    if (!entry.frame.isConnected) {
      unregisterPreviewFit(entry.frame);
    }
  }
}

/**
 * Makes the cell's height pin agree with the preview iframe inside it.
 *
 * The pin keeps FORMCYCLE from shrinking a taller preview, but the iframe's own height is the
 * authoritative value: when the two disagree the cell shows a large empty gap (pin taller than the
 * freshly reloaded 360px iframe) or clips the preview (pin shorter). A reload resets the iframe to
 * 360px, so reconciling both on every refresh keeps the layout self-correcting.
 *
 * @param wrapper The element cell (the iframe's parent).
 * @param frame   The preview iframe inside it.
 */
function reconcilePreviewPin(wrapper: HTMLElement, frame: HTMLIFrameElement): void {
  const height = String(frame.style.height ?? "").trim();
  if (height === "" || height === "0px") {
    clearPreviewWrapperHeight(wrapper);
    return;
  }
  if (wrapper.style.minHeight !== height) {
    wrapper.style.minHeight = height;
  }
  const pinValue = height.replace("px", "");
  if (wrapper.dataset.codbiPreviewHeight !== pinValue) {
    wrapper.dataset.codbiPreviewHeight = pinValue;
  }
  pinnedPreviewWrappers.add(wrapper);
}

/**
 * Self-heals every RUNNING element preview (called from {@link refreshBadges}, i.e. after every refresh):
 *
 * 1. the cell's height pin is reconciled with the iframe's own height (see {@link reconcilePreviewPin});
 * 2. a preview whose clip/fit loop died — e.g. its reload landed after the loop had already been
 *    superseded, leaving the iframe stuck at the initial 360px — gets a fresh loop instead of staying
 *    broken until the element is toggled by hand.
 *
 * @param items The designer's live items.
 */
function healRunningPreviews(items: Record<string, IMarkerItemLike>): void {
  for (const item of Object.values(items ?? {})) {
    try {
      if (!item || !elementPreviewOn(item)) {
        continue;
      }
      const anchor = anchorFor(item);
      if (!anchor) {
        continue;
      }
      const frame = anchor.querySelector<HTMLIFrameElement>(":scope > .codbi-func-preview-frame");
      if (!frame || !frame.isConnected) {
        // The designer re-rendered the cell and dropped our iframe: rebuild it instead of leaving the
        // cell without a preview (see applyElementPreview — the stale signature must not count as
        // "applied" once the iframe is gone).
        if (!elementPreviewsSuspended()) {
          applyElementPreview(item, anchor, true);
        }
        continue;
      }
      reconcilePreviewPin(anchor, frame);
      if (previewClipLoops.get(frame) !== true) {
        // Re-use the CURRENT generation: bumping it here would invalidate the loop the iframe's own
        // `load` handler is about to start for exactly this document.
        scheduleClip(frame, item.getId?.() ?? "", 0, 0, previewClipGenerations.get(frame) ?? 0);
      }
    } catch (x) {
      console.warn("[CodBi] Preview: could not heal a running preview", x);
    }
  }
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
    // node — but NEVER a node that contains the element's OWN functionality editor (its UI is a
    // sibling of the tagged field) and never a pop-up. This is done unconditionally (not only when
    // the wrapper was recognised), so re-enabling the preview reliably isolates the element even if
    // the editor has not mounted yet (in which case the not-yet-created editor is simply a new node,
    // never hidden). Never use a document-wide editor lookup here: it would keep nodes of OTHER
    // elements (which contain THEIR editor) visible, i.e. render the whole form.
    const editor = findOwnEditor(el);
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
    const fit = registerPreviewFit(frame, owner, item, elementRef);
    observePreview(owner);
    fitPreviewHeight(fit);
    // A previous give-up hid the frame (and the document) — a successful clip must reveal it again.
    // This runs last so the freshly clipped content is shown, never the unclipped page.
    frame.style.visibility = "";
    if (owner.documentElement) {
      owner.documentElement.style.visibility = "";
    }
    return true;
  } catch (x) {
    console.error("[CodBi] Preview: could not clip the preview to the element", x);
    return false;
  }
}

/** Attributes a rendered formcycle element carries its designer item identity through. */
const PREVIEW_FIND_ATTRIBUTES = ["id", "xi", "data-xi", "name", "data-name", "data-xn", "xn"];

/** The render-identity attributes (point at the actual control/wrapper), preferred over the name family. */
const PREVIEW_RENDER_ID_ATTRIBUTES = ["id", "xi", "data-xi"];

/** Page/container content blocks — candidates that widen to the full content card in {@link elementContentCard}. */
const PREVIEW_BLOCK_CLASS = /(^|\s)(CXPage|XPage|CXContainer|XContainer|CXFieldSet|XFieldSet)(\s|$)/;

/**
 * `true` when the element carries the designer item id as its FULL value or as the final `-`-token of
 * one of its identity attributes. Formcycle prefixes a rendered element's id/xi/name with a type
 * token: the designer item id `datum` renders as `id="xi-tf-datum"`, `xi="xi-tf-datum"`,
 * `data-xn="tfDatum"`. The final `-`-token of `xi-tf-datum` is `datum`, so the element matches
 * while its `-xc` / `-label` wrapper nodes (`xi-tf-datum-xc`, `xi-tf-datum-label`) do NOT (their
 * final token is `xc` / `label`) — they are never mistaken for the element itself.
 */
function previewIdentityMatches(el: Element, lowerId: string): boolean {
  for (const name of PREVIEW_FIND_ATTRIBUTES) {
    const value = (el.getAttribute(name) ?? "").trim().toLowerCase();
    if (!value) {
      continue;
    }
    if (value === lowerId) {
      return true;
    }
    const segments = value.split("-");
    if (segments[segments.length - 1] === lowerId) {
      return true;
    }
  }
  return false;
}

/** `true` when [el] itself carries a page/container/fieldset content-block class. */
function previewIsContentBlock(el: Element): boolean {
  return PREVIEW_BLOCK_CLASS.test(String(el.className ?? ""));
}

/** `true` when [el] matches the id through its OWN render-identity attribute (`id`/`xi`/`data-xi`). */
function previewMatchesRenderIdentity(el: Element, lowerId: string): boolean {
  for (const name of PREVIEW_RENDER_ID_ATTRIBUTES) {
    const value = (el.getAttribute(name) ?? "").trim().toLowerCase();
    if (!value) {
      continue;
    }
    if (value === lowerId) {
      return true;
    }
    if (value.split("-")[value.split("-").length - 1] === lowerId) {
      return true;
    }
  }
  return false;
}

/** Collects every element in [doc] whose identity attributes end with the (prefixed) designer item id. */
function previewFuzzyCandidates(doc: Document, id: string): HTMLElement[] {
  const lowerId = id.toLowerCase();
  const out: HTMLElement[] = [];
  const selector = PREVIEW_FIND_ATTRIBUTES.map((name) => `[${name}]`).join(",");
  for (const el of Array.from(doc.querySelectorAll<HTMLElement>(selector))) {
    if (previewIdentityMatches(el, lowerId)) {
      out.push(el);
    }
  }
  return out;
}

/**
 * Picks the best fuzzy candidate. A page/container's design id often sits on the `.CXPage`/
 * `.CXContainer` content block AND on small navigation nodes (a next/prev page link, a page
 * `<option>`) that share the same `data-xn`/`name`. Clipping to such a navigation node yields an
 * EMPTY preview, so the page/container content block and render-identity (`id`/`xi`) candidates are
 * preferred over bare name-family matches.
 */
function previewPickCandidate(candidates: HTMLElement[], lowerId: string): HTMLElement | null {
  const contentBlocks = candidates.filter((el) => previewIsContentBlock(el));
  if (contentBlocks.length > 0) {
    // Innermost content block wins (shortest `id`); `elementContentCard` widens it to the full card.
    return contentBlocks.reduce((a, b) =>
      (b.getAttribute("id") ?? "").length < (a.getAttribute("id") ?? "").length ? b : a,
    );
  }
  const renderIdentity = candidates.filter((el) => previewMatchesRenderIdentity(el, lowerId));
  const pool = renderIdentity.length > 0 ? renderIdentity : candidates;
  // The control/wrapper is the most specific node (shortest `id`); a page/container wrapper is
  // re-anchored to its content card by `elementContentCard` regardless.
  return pool.reduce((a, b) => ((b.getAttribute("id") ?? "").length < (a.getAttribute("id") ?? "").length ? b : a));
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
  // FORMCYCLE prefixes a rendered element's id/xi/name with a type token: the designer item id
  // `datum` renders as `id="xi-tf-datum"` (and `name="tfDatum"`). The exact matches above then MISS
  // such an element, `clipPreviewToElement` returns false for all 16 attempts and the preview falls
  // back to the WHOLE page (header + footer). Match the id as the final `-`-token of an identity
  // attribute so the element is located despite the prefix.
  const candidates = previewFuzzyCandidates(doc, id);
  if (candidates.length > 0) {
    const picked = previewPickCandidate(candidates, id.toLowerCase());
    if (picked) {
      return picked;
    }
  }
  for (const frame of Array.from(doc.querySelectorAll("iframe"))) {
    try {
      const inner = (frame as HTMLIFrameElement).contentDocument;
      if (!inner) {
        continue;
      }
      const found = findPreviewElement(inner, id);
      if (found) {
        return found;
      }
    } catch {
      /* cross-origin — ignore */
    }
  }
  return null;
}

/**
 * Fallback when the preview document loaded but the element could not be located. The iframe loads a
 * WHOLE form instance, so sizing it to the document (the previous behaviour) displayed the ENTIRE
 * form inside a widget whose preview switch promises a single element. Collapse the iframe instead:
 * the element cell keeps its preview switch, but no misleading whole-form content is shown. A later
 * re-apply restores the iframe (see `renderServerPreview`).
 */
function collapseUnresolvedPreview(frame: HTMLIFrameElement): void {
  try {
    frame.style.visibility = "hidden";
    frame.style.height = "0";
    // No element was found, so there is no preview height to hold — release the pin so the cell can
    // shrink back to its native size instead of keeping a stale tall min-height.
    clearPreviewWrapperHeight(frame.parentElement);
    const doc = frame.contentDocument;
    if (doc?.documentElement) {
      doc.documentElement.style.visibility = "hidden";
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
 * Absolute base URL (with a trailing slash) of the FORMCYCLE application the designer is served
 * from, e.g. `https://host/xima-formcycle/` or `https://host/` for a root deployment.
 *
 * The designer's OWN configuration (`urls.base`) is authoritative here: FORMCYCLE sets it to the
 * application's real context path, including `""` when the app runs at the server root and any
 * reverse-proxy prefix used in production. Deriving the base by slicing the page URL
 * (`href.split("/").slice(0, 4)`) silently assumes exactly ONE path segment before
 * `/form-management/` — on a live server deployed at the root (or behind a path prefix) that turned
 * the preview URL into `…/form-management/form-management/designer/preview/<id>`, which 404s.
 */
function designerAppBaseUrl(): string {
  try {
    const configured = getDesignerConfig()?.urls?.base;
    if (configured !== undefined && configured !== null) {
      // Accepts a relative base (`/xima-formcycle`, `/`, `""`) as well as an absolute URL.
      return new URL(`${String(configured).trim().replace(/\/+$/, "")}/`, `${window.location.origin}/`).href;
    }
  } catch (x) {
    console.warn("[CodBi] Preview: could not read designer config urls.base — falling back to path heuristic", x);
    /* configuration not available yet or malformed — fall back to the path heuristic */
  }
  // Fallback: keep everything in front of the designer's `/form-management/` route segment. This
  // works for a missing/empty config, the root context and ANY number of context-path segments.
  const marker = "/form-management/";
  const path = window.location.pathname;
  const at = path.lastIndexOf(marker);
  return at >= 0 ? `${window.location.origin}${path.slice(0, at)}/` : `${window.location.origin}/`;
}

/**
 * The platform's designer-preview URL for the CURRENT form, e.g.
 * `http://host/context/designer/preview/152?xfd2id=<draftId>`. Loading this URL in a hidden iframe
 * yields a real formcycle form instance (full bootstrap + runtime + CodBi runtime), so the preview
 * shows full form-level fidelity instead of a hand-patched element.
 *
 * The preview route is derived FROM THE CURRENT DESIGNER PAGE'S PATH rather than hard-coding a
 * `form-management` prefix: the designer editor page is `…/{prefix}/designer/{projectId}` and the
 * preview is `…/{prefix}/designer/preview/{projectId}`. Replacing the `/designer/{id}` tail in place
 * automatically preserves the context path and any tenant segment, so it works on BOTH a single-tenant
 * dev deployment (`…/form-management/designer/preview/{id}`) AND a multi-tenant live deployment
 * (`…/StadtAnsbach/designer/preview/{id}`), and it uses the correct origin from `window.location`
 * instead of a possibly-stale `urls.base` config value.
 *
 * The project id comes from `XFC_METADATA.currentProject.id`; the `xfd2id` (the form-design / draft id)
 * is read from the designer page's URL (walking up the frame chain, since the designer may be framed).
 */
function designerPreviewUrl(): string {
  const projectId = currentProjectId();
  if (!projectId) {
    console.warn("[CodBi] Preview: no project id — cannot build designer preview URL");
    return "";
  }
  const draftId = designerDraftId();
  const query = draftId ? `?xfd2id=${encodeURIComponent(draftId)}` : "";
  const pathname = window.location.pathname;
  const at = pathname.lastIndexOf("/designer/");
  if (at >= 0) {
    // Keep everything up to and including "/designer/" (context + tenant + any prefix), then the preview
    // route replaces the remaining "{projectId}" with "preview/{projectId}".
    const base =
      `${window.location.origin}${pathname.slice(0, at)}/designer/preview/` + `${encodeURIComponent(projectId)}`;
    return `${base}${query}`;
  }
  // Fallback for an unusual embedding where "/designer/" is not on the path: fall back to the base-url
  // heuristic (which itself prefers `urls.base`, then slices around "/form-management/").
  const base = designerAppBaseUrl();
  console.warn(
    "[CodBi] Preview: '/designer/' not found in designer page path %s — falling back to base heuristic %s",
    pathname,
    base,
  );
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
    // The preview is gone, so the cell must return to its native height.
    clearPreviewWrapperHeight(wrapper);
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

/** Selector matching every node the element markers / element previews create and maintain themselves. */
const OWN_NODE_SELECTOR = [
  ".codbi-elem-badge",
  ".codbi-func-badge",
  ".codbi-func-preview-switch",
  ".codbi-func-preview-frame",
  ".codbi-elem-preview",
  ".codbi-func-preview--rendered",
  "#codbi-elem-marker-css",
].join(", ");

/** Attributes whose changes are worth reporting — everything else is designer noise. */
const OBSERVED_ATTRIBUTES = [
  "style",
  "src",
  "class",
  "data-codbi-preview",
  "data-codbi-preview-height",
  "data-codbi-fit-height",
];

/**
 * @param node - A mutated node (or the target of an attribute mutation).
 * @returns `true` when the node is one of OUR OWN badge/preview nodes (or lives inside one).
 */
function isOwnNode(node: Node | null | undefined): boolean {
  const el = node instanceof Element ? node : (node?.parentElement ?? null);
  if (!el) {
    return false;
  }

  try {
    return el.matches(OWN_NODE_SELECTOR) || el.closest(OWN_NODE_SELECTOR) !== null;
  } catch {
    return false;
  }
}

/**
 * @param node - A mutated node.
 * @returns `true` when the node IS a preview frame or HOSTS one (the cell whose height we pin).
 */
function isPreviewHost(node: Node | null | undefined): boolean {
  const el = node instanceof Element ? node : null;
  if (!el) {
    return false;
  }
  if (
    el.classList.contains("codbi-func-preview-frame") ||
    (el instanceof HTMLElement && pinnedPreviewWrappers.has(el))
  ) {
    return true;
  }

  try {
    return el.querySelector(":scope > .codbi-func-preview-frame") !== null;
  } catch {
    return false;
  }
}

/**
 * @param record - A mutation record reported for the canvas root.
 * @returns `true` when the record was caused by the element markers / previews THEMSELVES.
 */
function isOwnMutation(record: MutationRecord): boolean {
  if (record.type === "attributes") {
    if (isOwnNode(record.target)) {
      return true;
    }
    // Fitting/pinning a preview resizes the FRAME and the cell that hosts it — both are ours.
    const name = record.attributeName ?? "";
    return (name === "style" || name === "src" || name.startsWith("data-codbi")) && isPreviewHost(record.target);
  }

  const nodes = [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)];
  return nodes.length > 0 && nodes.every((node) => isOwnNode(node) || isPreviewHost(node));
}

/**
 * @returns `true` when the designer replaced canvas DOM that carried one of OUR widgets, i.e. when a
 * badge, a preview switch or a running preview frame was detached and has to be rebuilt.
 *
 * This is the ONLY reason a canvas mutation may trigger a refresh: the FORMCYCLE designer re-renders
 * the canvas constantly (it swaps `<head>` styles, re-measures bodies, toggles classes), and reacting
 * to that chatter kept restarting the refresh — the storm in the preview log. Everything else that
 * changes what a badge shows (properties, attributes, the item set) already reaches us through the
 * designer's own callbacks (`items-created`, `set-property`, …).
 */
function lostOwnWidgets(): boolean {
  for (const widget of badges.values()) {
    if (!widget.isConnected) {
      return true;
    }
  }
  for (const widget of funcBadges.values()) {
    if (!widget.isConnected) {
      return true;
    }
  }
  for (const widget of previewSwitches.values()) {
    if (!widget.isConnected) {
      return true;
    }
  }
  for (const wrapper of pinnedPreviewWrappers) {
    if (!wrapper.isConnected || wrapper.querySelector(":scope > .codbi-func-preview-frame") === null) {
      return true;
    }
  }
  return false;
}

/**
 * Observes `root` for DOM changes (once). Also mirrors the ALT+V shortcut into a foreign document
 * (the canvas iframe), whose keydown events do not bubble to the designer frame. Shadow-root events
 * are composed and DO reach the designer document, so no extra listener is needed there.
 *
 * The callback ignores mutations of our OWN nodes: the clip/fit loops resize and re-pin the preview
 * iframes on their own timers (i.e. BETWEEN two refresh passes, where draining the pass' own records
 * cannot help), and reacting to that churn queued one refresh after another — the refresh storm that
 * re-fitted every preview dozens of times and eventually broke the canvas layout.
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
  const observer = new MutationObserver((records) => {
    if (refreshing) {
      return;
    }
    // Only a GENUINE designer re-render may schedule a refresh: neither the records a pass produced
    // itself nor the churn of our badge/preview nodes between passes (the clip/fit loops resize the
    // frames and pin the cells on their own timers) are a reason to re-render the badges again.
    if (records.length > 0 && records.every(isOwnMutation)) {
      return;
    }
    // A designer re-render only matters when it took one of our widgets down with it.
    if (!lostOwnWidgets()) {
      return;
    }
    scheduleRefresh();
  });
  observer.observe(root, { attributes: true, attributeFilter: OBSERVED_ATTRIBUTES, childList: true, subtree: true });
  observedRoots.set(root, observer);
}

/**
 * Throws away the mutation records that a refresh pass produced ITSELF.
 *
 * A `MutationObserver` callback is a microtask, so it runs AFTER {@link refreshBadges} has reset its
 * `refreshing` flag — the flag alone therefore cannot stop a pass from re-triggering itself. Every
 * pass that touches the canvas (badges, preview switches, height pins) would queue another pass 60 ms
 * later, which again touches the canvas: an endless refresh storm that keeps re-fitting the preview
 * iframes while the user is working (the "layout breaks after the third toggle" symptom). Draining the
 * pending records at the end of a pass cuts that feedback loop, while genuine designer mutations
 * arriving AFTER the pass still schedule the next one.
 */
function discardSelfMutations(): void {
  for (const observer of observedRoots.values()) {
    try {
      observer.takeRecords();
    } catch {
      /* the observed root may be gone (canvas iframe replaced) */
    }
  }
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

/**
 * Enables badge expansion while the pointer is over the BADGE (not merely over its widget), without
 * turning the badge into a pointer target: a hover-capturing overlay inside an item can become the
 * drop target when a new element is dropped onto the widget, breaking the designer's drop-on-item
 * logic (see the note after `BADGE_CSS`). The listeners therefore live on the widget cell and toggle
 * `codbi-elem-badge--hover` when the pointer is inside a badge's rectangle or over one of its
 * descendants (the parameter popup may extend past the badge box).
 *
 * @param anchor The widget cell that hosts the badges.
 */
function installBadgeHoverTracking(anchor: HTMLElement): void {
  if (badgeHoverTracked.has(anchor)) {
    return;
  }
  badgeHoverTracked.add(anchor);
  /** Marks exactly the badge under the pointer as hovered. */
  const update = (event: PointerEvent): void => {
    const target = event.target as Node | null;
    for (const child of Array.from(anchor.children)) {
      if (!child.classList.contains(BADGE_CLASS)) {
        continue;
      }
      const badge = child as HTMLElement;
      const rect = badge.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      badge.classList.toggle("codbi-elem-badge--hover", inside || (target !== null && badge.contains(target)));
    }
  };
  anchor.addEventListener("pointermove", update);
  anchor.addEventListener("pointerleave", () => {
    for (const child of Array.from(anchor.children)) {
      if (child.classList.contains(BADGE_CLASS)) {
        child.classList.remove("codbi-elem-badge--hover");
      }
    }
  });
}

/**
 * Toggles the same `codbi-elem-badge--hover` expansion state from direct badge pointer events. This
 * is the PREVIEW-mode path: the preview iframe swallows pointer movement, so the anchor proximity
 * tracker never runs; the preview stylesheet makes the badge a pointer target instead (see the
 * preview rules in `BADGE_CSS`), and these listeners react to it. In design mode the badge stays
 * click-through, so they simply never fire.
 *
 * @param badge The badge to wire.
 */
function wireBadgeHoverEvents(badge: HTMLElement): void {
  if (badge.dataset.codbiHoverWired === "1") {
    return;
  }
  badge.dataset.codbiHoverWired = "1";
  badge.addEventListener("pointerenter", () => badge.classList.add("codbi-elem-badge--hover"));
  badge.addEventListener("pointerleave", () => badge.classList.remove("codbi-elem-badge--hover"));
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
  wireBadgeHoverEvents(badge);
  installBadgeHoverTracking(anchor);
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
 * Every row holds the (fixed) parameter name, an EDITABLE value control, a trash button that removes
 * the parameter and an **ƒ EP-builder button** right of the trash (mirroring the per-element CodBi
 * config panel). Every change is written straight into the item's property bag, so it shows up in the
 * element's config attribute table. At the end of each group an "add parameter" `<select>` lists the
 * functionality's available parameters that are NOT yet set — choosing one adds it (empty value) and
 * re-renders the badge.
 *
 * The EP-builder button is available for EVERY parameter row. Applying an EP writes the serialized
 * value through the same path as a manual edit; since an EP is not a literal of the parameter's type,
 * the row then renders a text input instead of a toggle/select. Pressing **ALT+E** on a text input
 * opens the same {@link openEPBuilder } popup.
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
  // Bulletproof opaque backing for the parameter table. A Mirror widget renders ANOTHER form's theme
  // CSS into the same canvas; that theme can override the popup/table stylesheet backgrounds and
  // leave the table BODY see-through only there. An INLINE !important background cannot be beaten by
  // any host stylesheet rule (nor does it depend on BADGE_CSS winning the cascade), so the table stays
  // opaque regardless of the surrounding widget.
  popup.style.setProperty("background-color", "#fff", "important");
  const table = doc.createElement("table");
  table.className =
    variant === "css"
      ? "codbi-func-table codbi-func-table--css"
      : variant === "holistic"
        ? "codbi-func-table codbi-func-table--holistic"
        : "codbi-func-table";
  table.style.setProperty("background-color", "#fff", "important");
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
    // Opens the EP builder for this row's value. Shared by the ALT+E shortcut (text inputs) and the
    // "ƒ" EP-builder button in the actions cell, so both behave identically: the composed value is
    // written back through the SAME path as a manual edit.
    let openEpFor: (() => void) | undefined;
    /** Opens the EP builder for one row value and hands the composed value to `apply`. */
    const openBuilderForValue = (initial: string, apply: (value: string) => void): void => {
      openEPBuilder({
        // Render into the DESIGNER document (not the canvas iframe) so the popup snaps to the
        // designer window's edges, exactly like the Form Assistant dialog.
        document: window.document,
        anchor,
        value: initial,
        listEPs: listElementPlaceholders,
        onApply: (applied) => {
          apply(applied);
        },
      });
    };
    // Attaches the ALT+E EP-builder shortcut + Enter-commit behaviour to a text-like control.
    const bindTextShortcuts = (input: HTMLInputElement): void => {
      openEpFor = (): void => {
        openBuilderForValue(input.value, (applied) => {
          input.value = applied;
          setFuncAttribute(resolve(), attrName, applied);
          input.blur();
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
    // A value that is NOT a literal of its type (e.g. a stored EP placeholder) is always rendered as a
    // text input — otherwise a toggle/select would silently display it as empty, hiding the EP.
    const literalBoolean = type === "boolean" && /^(?:|true|false|1|0)$/i.test(value.trim());
    const literalEnum =
      type === "enum" && (spec?.options?.length ?? 0) > 0 && (value === "" || (spec?.options ?? []).includes(value));
    let control: HTMLElement;
    if (literalBoolean) {
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
      // Boolean parameters get the EP-builder button too, exactly like the form element's config
      // panel. The builder composes a free-text/EP value which a toggle cannot display, so applying it
      // writes the attribute and the badge re-renders this row as a TEXT input (see `literalBoolean`).
      openEpFor = (): void => {
        openBuilderForValue(value, (applied) => {
          setFuncAttribute(resolve(), attrName, applied);
        });
      };
    } else if (literalEnum) {
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
      // Enum parameters get the EP-builder button too. Applying an EP writes the attribute; the badge
      // then renders this row as a text input (the value is no longer one of the enum's literals).
      openEpFor = (): void => {
        openBuilderForValue(value, (applied) => {
          setFuncAttribute(resolve(), attrName, applied);
        });
      };
    } else {
      // A numeric parameter holding a non-numeric value (i.e. an EP placeholder) must use a TEXT input —
      // an `<input type="number">` would silently blank the composed value.
      const numericInput =
        (type === "integer" || type === "number") && (value.trim() === "" || Number.isFinite(Number(value)));
      const input = doc.createElement("input");
      input.type = numericInput ? "number" : "text";
      if (numericInput && type === "integer") {
        input.step = "1";
      } else if (numericInput && type === "number") {
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
    // The EP-builder button, right of the trash icon: opens the EP builder for this attribute's
    // value, exactly like the "ƒ" icon next to the form element's config parameter values. EVERY
    // parameter row exposes it — for boolean/enum rows the composed value is written to the attribute
    // and the row then renders as a text input (see `literalBoolean` / `literalEnum`).
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
    // Back EVERY body row's cells with an opaque white (inline !important). In a Mirror widget's open
    // shadow root the row-group background alone can be bypassed, so each cell needs its own opaque
    // backing. This now ALSO covers the "+ Add" option rows - they were previously excluded, which left
    // exactly those rows transparent ("the table background is see-through"). Their hover tint is
    // restored via `background-image` (a separate longhand), so this inline background-color cannot
    // cancel it. Section-title and add-rows are built separately and have their own inline backgrounds.
    for (const cell of [name, valueCell, actionsCell]) {
      cell.style.setProperty("background-color", "#fff", "important");
    }
  };

  const body = doc.createElement("tbody");
  // See the comment at the top of this function: keep the table BODY opaque even when the host
  // widget's stylesheet would force it transparent.
  body.style.setProperty("background-color", "#fff", "important");
  for (const section of sections) {
    // Optional per-group header (the functionality / standard-configuration name).
    if (section.title && sections.length > 1) {
      const titleRow = doc.createElement("tr");
      titleRow.className = "codbi-func-section-title";
      const titleCell = doc.createElement("th");
      titleCell.scope = "colgroup";
      titleCell.colSpan = 3;
      titleCell.textContent = section.title;
      // Preserve the section-title colour with an INLINE !important so a Mirror widget's theme cannot
      // leave this cell transparent (the same shadow-root paint-order issue as the body: the row-group
      // white alone can be bypassed).
      titleCell.style.setProperty(
        "background-color",
        variant === "css" ? "#eff6ff" : variant === "holistic" ? "#ecfdf5" : "#f5f5f5",
        "important",
      );
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
      // The "+ Add" row is the ONLY body row when a functionality has no parameters yet — exactly the
      // case reported. Back its cells with opaque white too (inline !important), otherwise the host
      // theme / shadow-root paint order can leave it see-through. The trigger button keeps its own
      // background and hover colours.
      labelCell.style.setProperty("background-color", "#fff", "important");
      selectCell.style.setProperty("background-color", "#fff", "important");
      addRowEl.append(labelCell, selectCell);
      body.appendChild(addRowEl);
    }
  }
  table.appendChild(body);
  // #region Optional diagnostics (enable with `window.CodbiBadgeTableDebug = true`).
  // Attached to the SUB-BADGE — hovering it is what reveals this popup — and evaluated at HOVER time,
  // so the flag can be toggled in the console without rebuilding the badge. The flag may live in an
  // ancestor frame (see `badgeTableDebugEnabled`). Logs once per rebuilt sub-badge.
  subBadge.addEventListener("mouseenter", () => {
    if (!badgeTableDebugEnabled() || subBadge.dataset.codbiTableDiag === "1") {
      return;
    }
    subBadge.dataset.codbiTableDiag = "1";
    // Defer so the popup's open transition (max-height/visibility) has applied before inspecting it.
    window.setTimeout(() => {
      try {
        const win = doc.defaultView ?? window;
        const rootNode = popup.getRootNode();
        const styles = Array.from(
          (rootNode instanceof ShadowRoot || rootNode instanceof Document
            ? (rootNode as Document | ShadowRoot).querySelectorAll("style")
            : []) as ArrayLike<HTMLStyleElement>,
        );
        const hasBadgeCss = styles.some((style) => (style.textContent ?? "").includes(".codbi-func-table"));
        const cs = (el: Element | null): CSSStyleDeclaration | null => (el ? win.getComputedStyle(el) : null);
        const bg = (el: Element | null): string => cs(el)?.backgroundColor ?? "n/a";

        console.groupCollapsed("[CodBi][diag] badge parameter table background");
        console.log("host root:", rootNode, rootNode instanceof ShadowRoot ? "(shadow root)" : "(document)");
        console.log("BADGE_CSS present in host root:", hasBadgeCss);
        console.log("popup computed background:", bg(popup), "opacity:", cs(popup)?.opacity);
        console.log("table computed background:", bg(table));
        console.log("tbody computed background:", bg(body));
        const firstRow = body.rows[0];
        const firstCell = firstRow?.cells?.[0] ?? null;
        console.log("first body cell computed background:", bg(firstCell));
        console.log(
          "first row class:",
          firstRow?.className || "(none)",
          "| first cell:",
          firstCell?.tagName ?? "n/a",
          firstCell?.className || "(no class)",
        );
        console.log(
          "inline tbody background:",
          body.style.getPropertyValue("background-color"),
          "priority:",
          body.style.getPropertyPriority("background-color"),
        );

        // #region Ancestor translucency — a translucent ancestor makes even solid white look see-through.
        const flagged: string[] = [];
        let cursor: Element | null = firstCell;
        let depth = 0;
        while (cursor && depth < 16) {
          const s = win.getComputedStyle(cursor);
          if (s.opacity !== "1" || s.filter !== "none" || s.mixBlendMode !== "normal" || s.transform !== "none") {
            flagged.push(
              `${cursor.tagName}.${cursor.getAttribute("class") ?? ""} ` +
                `opacity=${s.opacity} filter=${s.filter} blend=${s.mixBlendMode} transform=${s.transform}`,
            );
          }
          cursor = cursor.parentElement;
          depth += 1;
        }
        console.log("ancestor opacity/filter/blend/transform (non-default):", flagged);
        // #endregion Ancestor translucency.

        // #region Hit-test — what is actually the topmost element at the cell's centre?
        const rect = firstCell?.getBoundingClientRect();
        if (rect && rect.width > 1 && rect.height > 1) {
          const x = rect.left + rect.width / 2;
          const y = rect.top + rect.height / 2;
          const shadow =
            rootNode instanceof ShadowRoot
              ? (rootNode as unknown as { elementFromPoint?: (px: number, py: number) => Element | null })
              : null;
          const topEl = shadow?.elementFromPoint?.(x, y) ?? doc.elementFromPoint(x, y);
          console.log(
            "elementFromPoint at first-cell centre:",
            topEl?.tagName ?? "n/a",
            (topEl as HTMLElement | null)?.className || "(no class)",
            "| is the cell (or inside it)?",
            Boolean(firstCell && (topEl === firstCell || firstCell.contains(topEl))),
          );
          console.log("first cell rect:", {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            w: Math.round(rect.width),
            h: Math.round(rect.height),
          });
        }
        // #endregion Hit-test.

        // #region Overlay detection — list EVERY element whose rect overlaps the first cell, regardless
        // of pointer-events. `elementFromPoint` skips `pointer-events:none` overlays, so an overlay that
        // covers the body (but not the header) would otherwise be invisible to the hit-test.
        if (rect && rect.width > 1 && rect.height > 1) {
          const seen = new Set<Element>();
          const pools: Element[][] = [];
          try {
            pools.push(Array.from(doc.querySelectorAll("*")));
          } catch {
            /* ignore */
          }
          if (rootNode instanceof ShadowRoot) {
            try {
              pools.push(Array.from(rootNode.querySelectorAll("*")));
            } catch {
              /* ignore */
            }
          }
          const overlapping: string[] = [];
          for (const pool of pools) {
            for (const el of pool) {
              if (seen.has(el)) {
                continue;
              }
              seen.add(el);
              if (el === firstCell || firstCell?.contains(el) || (firstCell && el.contains(firstCell))) {
                continue;
              }
              const r = el.getBoundingClientRect();
              if (r.width <= 0 || r.height <= 0) {
                continue;
              }
              const overlaps = r.left < rect.right && r.right > rect.left && r.top < rect.bottom && r.bottom > rect.top;
              if (!overlaps) {
                continue;
              }
              const s = win.getComputedStyle(el);
              // Only report elements that can paint something: positioned, or with a background/border.
              const paints =
                s.position !== "static" ||
                s.backgroundColor !== "rgba(0, 0, 0, 0)" ||
                s.backgroundImage !== "none" ||
                s.boxShadow !== "none";
              if (!paints) {
                continue;
              }
              overlapping.push(
                `${el.tagName}.${el.getAttribute("class") ?? ""} pos=${s.position} z=${s.zIndex} ` +
                  `pe=${s.pointerEvents} op=${s.opacity} bg=${s.backgroundColor} img=${s.backgroundImage !== "none"}`,
              );
            }
          }
          console.log("elements overlapping the first cell (top-most last):", overlapping.slice(0, 40));
        }
        // #endregion Overlay detection.
        console.groupEnd();
      } catch (x) {
        console.warn("[CodBi][diag] could not inspect the badge table", x);
      }
    }, 90);
  });
  // #endregion Optional diagnostics.
  return table;
}

/** All expandable sub-badges (functionality, CSS-class and holistic) of a badge's functionality list. */
function subBadgeItems(list: HTMLElement): HTMLElement[] {
  return Array.from(list.querySelectorAll<HTMLElement>(".codbi-func-item, .codbi-css-item, .codbi-holistic-item"));
}

/**
 * Adds or removes the JS-held `--open` class of ONE sub-badge (whichever variant it is).
 *
 * This class is the FOCUS retention of the parameter popup: it is added on `focusin` so the table
 * stays expanded while a control inside it holds focus. Hover disclosure is pure CSS (`:hover`), so
 * a `--open` class left behind by a mere hover keeps the table expanded forever — the bug this
 * helper exists to prevent.
 */
function setSubBadgeOpen(item: HTMLElement, open: boolean): void {
  let cls = "codbi-func-item--open";
  if (item.classList.contains("codbi-css-item")) {
    cls = "codbi-css-item--open";
  } else if (item.classList.contains("codbi-holistic-item")) {
    cls = "codbi-holistic-item--open";
  }
  item.classList.toggle(cls, open);
}

/**
 * Drops the focus-retention `--open` class of EVERY sub-badge of a functionality list — regardless of
 * its colour (orange functionality, blue standard-config class, green holistic) — except the one
 * whose popup still holds focus. Called whenever the pointer leaves the badge, so a table that was
 * only hovered can never stay expanded (a rebuild may have re-applied the class in the meantime).
 */
function closeSubBadges(list: HTMLElement): void {
  const active = list.ownerDocument?.activeElement ?? null;
  for (const sub of subBadgeItems(list)) {
    if (active !== null && sub.contains(active)) {
      continue;
    }
    setSubBadgeOpen(sub, false);
  }
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
  // Opening another sub-badge (hover or focus) must first close every other one — otherwise moving
  // the pointer from badge A to badge B leaves A's `--open` class intact and BOTH tables stay
  // expanded.
  const openOnly = (active: HTMLElement): void => {
    for (const sibling of subBadgeItems(list)) {
      if (sibling !== active) {
        setSubBadgeOpen(sibling, false);
      }
    }
  };
  /** Forgets the tracked sub-badge once the focus leaves the ENTIRE badge (see the focusout blocks). */
  const onSubBadgeFocusOut = (event: FocusEvent): void => {
    const next = event.relatedTarget as Node | null;
    if (!next || !list.contains(next)) {
      openFuncSubBadge = null;
    }
  };
  // Leaving the whole badge closes everything: the tracked sub-badge AND every focus-retention
  // `--open` class. The latter may have been re-applied by a rebuild that happened while the pointer
  // was over the badge (the "survive a rebuild" blocks), and without dropping it here a table that
  // was only ever HOVERED stays expanded after the pointer has left — the reported bug. A sub-badge
  // whose popup still holds focus is spared, because the focus itself keeps the table open.
  list.addEventListener("mouseleave", () => {
    openFuncSubBadge = null;
    closeSubBadges(list);
  });
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
      // Hovering only REVEALS the table (CSS `:hover`) — it must NOT add the focus-retention `--open`
      // class, which nothing would remove once the pointer leaves and which therefore kept the table
      // expanded forever after a single hover.
      item.addEventListener("mouseenter", () => {
        openFuncSubBadge = func.name;
        openOnly(item);
        applyFuncPopupWidth(item, params, anchor, params.dataset.codbiMax === "1");
      });
      // Keep the popup open while a control inside it (the "+ Add" select or a value input) holds
      // focus — hovering alone collapses once the pointer leaves the sub-badge (which happens as soon
      // as a native select picker closes). `focusin`/`focusout` cover every control in the popup.
      params.addEventListener("focusin", () => {
        openFuncSubBadge = func.name;
        openOnly(item);
        setSubBadgeOpen(item, true);
      });
      params.addEventListener("focusout", (event) => {
        // Remove the focus-held `--open` (standard focus retention). `openFuncSubBadge` survives as
        // long as the focus stays INSIDE the badge: clearing it here is what made the SECOND "add
        // parameter" collapse when the user moved from the value input up to the "+ Add" trigger.
        // Moving the focus out of the whole badge clears it (see `onSubBadgeFocusOut`), so a later
        // rebuild cannot re-expand a table the user has already left.
        setSubBadgeOpen(item, false);
        onSubBadgeFocusOut(event);
      });
      // Survive a badge rebuild: if this sub-badge was open before, keep it open on the fresh DOM.
      if (openFuncSubBadge === func.name) {
        setSubBadgeOpen(item, true);
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
      // While the standard configuration that provides this class is NOT activated for the form, the
      // class is only a MARKER: dim the sub-badge (`.codbi-css-item--inactive`, see BADGE_CSS) and let
      // a CLICK ask whether that configuration shall be activated — the very same question the
      // per-element CodBi panel asks when such a class is applied. Confirming activates the
      // configuration, which changes the badge's change signature, so the sub-badge repaints at full
      // opacity. A class whose owning configuration cannot be resolved stays untouched (fail-open).
      const owner = standardConfigOwnerOfClass(cssClass);
      if (owner !== undefined && standardConfigClassIsInactive(cssClass)) {
        item.classList.add("codbi-css-item--inactive");
        item.title = `${cssClass}\n${formatMessage(i18n("designer.element.standardConfig.inactiveHint"), owner)}`;
        // Never let the click (or its mousedown) reach the designer canvas — it would select or even
        // activate the underlying widget instead of opening the question.
        item.addEventListener("mousedown", (event) => event.stopPropagation());
        item.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          requestStandardConfigActivation(cssClass);
        });
      }
      const sections = buildCssClassSections(cssClass, resolve());
      const params = doc.createElement("div");
      params.className = "codbi-func-item__params";
      item.appendChild(params);
      // Hovering only reveals the table via CSS `:hover` (see the func-loop comment).
      item.addEventListener("mouseenter", () => {
        openFuncSubBadge = cssClass;
        openOnly(item);
        applyFuncPopupWidth(item, params, anchor, params.dataset.codbiMax === "1");
      });
      params.addEventListener("focusin", () => {
        openFuncSubBadge = cssClass;
        openOnly(item);
        setSubBadgeOpen(item, true);
      });
      params.addEventListener("focusout", (event) => {
        // Remove the focus-held `--open`; `openFuncSubBadge` only survives while the focus stays
        // inside the badge (see the func-loop comment).
        setSubBadgeOpen(item, false);
        onSubBadgeFocusOut(event);
      });
      // Survive a badge rebuild: if this sub-badge was open before, keep it open on the fresh DOM.
      if (openFuncSubBadge === cssClass) {
        setSubBadgeOpen(item, true);
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
      // Hovering only reveals the table via CSS `:hover` (see the func-loop comment).
      item.addEventListener("mouseenter", () => {
        openFuncSubBadge = config.id;
        openOnly(item);
        applyFuncPopupWidth(item, params, anchor, params.dataset.codbiMax === "1");
      });
      params.addEventListener("focusin", () => {
        openFuncSubBadge = config.id;
        openOnly(item);
        setSubBadgeOpen(item, true);
      });
      params.addEventListener("focusout", (event) => {
        // Remove the focus-held `--open`; `openFuncSubBadge` only survives while the focus stays
        // inside the badge (see the func-loop comment).
        setSubBadgeOpen(item, false);
        onSubBadgeFocusOut(event);
      });
      // Survive a badge rebuild: if this sub-badge was open before, keep it open on the fresh DOM.
      if (openFuncSubBadge === config.id) {
        setSubBadgeOpen(item, true);
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
  // The ACTIVATION state of every applied standard configuration is folded in as well: activating one
  // of them (asked by clicking a DIMMED blue sub-badge) must rebuild the badge so that sub-badge loses
  // its `--inactive` dimming.
  const standardActivation = cssClasses
    .map((cssClass) => `${cssClass}\u0004${standardConfigClassIsInactive(cssClass) ? "0" : "1"}`)
    .join("\u0001");
  const signature = `${funcSignature(funcs, cssClasses, item)}\u0006${holistic
    .map((c) => c.id)
    .join("\u0001")}\u0006${holisticParamsSignature(holistic, item)}\u0006${standardActivation}`;

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
        // A focused (opened) parameter table must stay in front of the elements it overlaps.
        raiseMarkedWidget(badge.parentElement);
      });
      badge.addEventListener("focusout", (event) => {
        badge.classList.remove("codbi-elem-badge--focus-active");
        // Only lower the widget when the focus LEAVES the badge: moving from a value input to the
        // "+ Add" trigger must not drop the lift (the table would slide behind the next element).
        const next = (event as FocusEvent).relatedTarget as Node | null;
        if (!next || !badge.contains(next)) {
          lowerMarkedWidget(badge.parentElement);
        }
      });
      // The badge itself never captures the pointer (see the note after BADGE_CSS), but its sub-badges
      // do — so entering one of them reaches these listeners. Raising the WHOLE marked widget for as
      // long as the pointer is over (or in) the badge keeps the parameter table on top.
      badge.addEventListener("mouseenter", () => raiseMarkedWidget(badge.parentElement));
      badge.addEventListener("mouseleave", () => {
        // `:focus-within` keeps the lift and the tracked sub-badge while a control inside the badge
        // still holds focus. WITHOUT that focus nothing may stay "open" once the pointer is gone.
        const holdsFocus = badge.matches(":focus-within");
        if (!holdsFocus) {
          lowerMarkedWidget(badge.parentElement);
          openFuncSubBadge = null;
        }
        // Safety net that does not depend on WHICH part of the badge the pointer left through (the
        // functionality list, its popup or the logo): never leave a hover-revealed parameter table
        // expanded behind — including every colour of sub-badge (orange/blue/green). A control that
        // still holds focus keeps its table (`closeSubBadges` spares it).
        const list = badge.querySelector<HTMLElement>(".codbi-func-list");
        if (list) {
          closeSubBadges(list);
        }
      });
    }
  }
  if (badge.parentElement !== anchor) {
    anchor.appendChild(badge);
  }
  wireBadgeHoverEvents(badge);
  installBadgeHoverTracking(anchor);
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
    // Drop the JS-driven lift as well — a stuck `--raised` would keep the element above every other
    // form element even after the badges were removed.
    widget.classList.remove("codbi-elem-marked", RAISED_CLASS);
  }
  markedFuncWidgets.clear();
}

/**
 * The class that lifts a marked widget — and with it its parameter popup — above EVERY other layer of
 * the form while the widget's badge is hovered or holds focus (see the `--raised` rules in
 * {@link BADGE_CSS}). Toggled from JS rather than by `:has()`, so the popup is reliably readable on
 * top of the form elements it overlaps, in every browser.
 */
const RAISED_CLASS = "codbi-elem-marked--raised";

/** Raises a marked widget so its open parameter table paints over every neighbouring form element. */
function raiseMarkedWidget(widget: HTMLElement | null): void {
  widget?.classList.add(RAISED_CLASS);
}

/**
 * Lowers a marked widget again — but only when its badge neither holds focus nor is still hovered:
 * a control inside the table (a value input, the "+ Add" trigger) can keep the focus while the
 * pointer briefly leaves the widget, and dropping the lift then would hide the table behind the
 * neighbouring element mid-edit.
 */
function lowerMarkedWidget(widget: HTMLElement | null): void {
  if (!widget) {
    return;
  }
  const active = widget.ownerDocument?.activeElement ?? null;
  if (active && widget.contains(active)) {
    return;
  }
  widget.classList.remove(RAISED_CLASS);
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

/** Number of {@link refreshBadges} passes run so far. */
let refreshPass = 0;

/**
 * @returns How many refresh passes have run in this document.
 *
 * Exported for the regression tests of the refresh loop: a pass must never queue another pass, and a
 * genuine designer re-render must still queue exactly one.
 */
export function refreshPassCount(): number {
  return refreshPass;
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
  refreshPass++;
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
      // A persisted `data-cb-preview="1"` restores THIS element's preview on its own, even when the
      // form-level "Preview mode" is off: the attribute is the per-element source of truth (and the
      // only persistence for the switch), so a reload never requires re-activating the preview.
      const previewOn = elementPreviewOn(item);
      // In preview mode we ALSO need to reach plain elements (fields, fieldsets, containers, pages)
      // so they get their own preview switch — so don't bail out on non-widget items in that mode.
      if (!isMirror && !isFunc && !elementPreview && !previewOn) {
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
      // not just those carrying `data-cb-func`. An element whose persisted `data-cb-preview="1"`
      // keeps its switch even when the form-level mode is OFF (that is what makes the setting
      // persistent). Widgets (Mirror) and the FORMCYCLE spacer (which has nothing to preview — it is
      // pure layout) are excluded here.
      if ((elementPreview || previewOn) && !isMirror && !isSpacerItem(item) && anchor) {
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
    // Release preview height pins whose preview is gone (the designer re-renders cells in place, so a
    // pin used to outlive its preview and every further refresh pinned another cell – the canvas
    // layout drifted apart after a couple of refreshes).
    prunePreviewPins();
    // … and make the remaining ones agree with their iframe again, restarting a preview whose clip/fit
    // loop died (see healRunningPreviews).
    healRunningPreviews(items);
    // A preview whose document re-rendered itself lost the clip (the platform preview page re-renders
    // the form on every draft change — i.e. on each standard-configuration selection) and would show
    // the WHOLE form page again; re-clip it before anyone can see that.
    resyncDetachedPreviewClips();
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
    // Drop the records OUR OWN pass just produced, so the observer does not queue the next pass.
    discardSelfMutations();
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
 * Schedules a debounced re-application of the CodBi element badges.
 *
 * Exported so a caller that mutated an element's properties WITHOUT firing the designer's
 * `set-property` callback — which normally triggers this refresh — can still update the on-canvas
 * badges immediately. The per-element CodBi config panel uses this after toggling a functionality via
 * {@link setItemPropertyValueQuiet}, replacing the badge refresh the (expensive) `set-property`
 * callback used to provide.
 */
export function refreshCodbiElementMarkers(): void {
  scheduleRefresh();
}

/**
 * Nesting depth of {@link suspendElementPreviews}. While it is `> 0` NO element preview is (re)applied
 * and the preview-fitted resizes are postponed, so the designer canvas is not rebuilt.
 */
let previewSuspendDepth = 0;

/**
 * Suspends every element-preview (re)application until the matching {@link resumeElementPreviews}.
 *
 * Used while a MODAL question is open (the "activate this standard configuration?" dialog): the draft
 * sync, the badge refresh and the preview re-apply each make FORMCYCLE re-render the element cell, and
 * a preview that is rebuilt/reloaded under the modal comes back clipped (its fitted height no longer
 * matches) and with the platform's own preview chrome visible — even though the user has not decided
 * anything yet. Badges are still painted, only the preview WORK is frozen. Calls nest.
 */
export function suspendElementPreviews(): void {
  previewSuspendDepth++;
}

/**
 * Ends a {@link suspendElementPreviews} suspension. When the last one ends, ONE coalesced refresh runs
 * so the previews catch up with whatever changed while the modal was open.
 *
 * @param refresh `false` unfreezes WITHOUT re-applying anything — used when the modal question was
 *   DISMISSED, where re-actualising the previews is exactly what the user does not want. The freeze is
 *   still released, so a later refresh (any other change) picks the state up normally.
 */
export function resumeElementPreviews(refresh = true): void {
  previewSuspendDepth = Math.max(0, previewSuspendDepth - 1);
  if (previewSuspendDepth === 0 && refresh) {
    scheduleRefresh();
  }
}

/** Whether element previews are currently frozen (see {@link suspendElementPreviews}). */
function elementPreviewsSuspended(): boolean {
  return previewSuspendDepth > 0;
}

/**
 * Notifies the overlay that a **form-level** setting changed which influences every rendered widget,
 * so all RUNNING element previews are re-applied with the freshly synced draft:
 * - a form global variable was (re)set — e.g. through the global-variable picker (ALT+V) in the
 *   variables tab of the CodBi form options. Global variables feed the CodBi parameters
 *   (`<functionality>_<parameter>`) and the standard configurations' `globals`.
 * - a standard configuration (notably a **holistic** one, which resolves its targets by a runtime
 *   selector) was activated/deactivated in the CodBi form options.
 *
 * The revision is folded into {@link elementPreviewSignature}, so `refreshBadges` reaches
 * {@link applyElementPreview}, which detects the changed signature and debounces a reload of the
 * preview iframe (the server-side draft needs time to sync — see {@link PREVIEW_REAPPLY_DELAY_MS}).
 */
export function notifyFormPreviewChanged(): void {
  formPreviewRevision++;
  scheduleRefresh();
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
    // locating the input by id or on the property having been persisted. The `property` in the
    // detail tells the "Mark elements" switch apart from the "Preview" switch (they reuse the editor),
    // so one switch can never flip the other mode.
    document.addEventListener(MARK_ELEMENTS_CHANGED_EVENT, (event: Event) => {
      const detail = (event as CustomEvent<{ property?: string; enabled?: boolean; showLabels?: boolean }>).detail;
      if (typeof detail?.enabled === "boolean") {
        if (detail.property === PREVIEW_ELEMENTS_PROPERTY) {
          previewSwitchEnabled = detail.enabled;
        } else if (detail.property === MARK_PROPERTY || detail.property == null) {
          switchEnabled = detail.enabled;
        }
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
