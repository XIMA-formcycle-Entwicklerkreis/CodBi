// #region Imports
import {
  allGradientsIn,
  colorTokenAt,
  firstColorToken,
  firstGradientIn,
  isGradientLike,
  openColorPicker,
  openGradientBuilder,
  parseColor,
  rememberGradient,
  replaceColorToken,
  swatchCss,
} from "./CssColorTools.js";
import type { IColorToken } from "./CssColorTools.js";
import { openEPBuilder } from "./EPBuilder.js";
import { getDesignerLanguage } from "./i18n.js";

import {
  cssKindOf,
  cssValueSummary,
  decodeCssValue,
  dialectToBraces,
  encodeCssValue,
  extractPlaceholders,
  formatCss,
  isKnownProperty,
  isKeyframeSteps,
  joinDeclarations,
  knownProperties,
  lintCss,
  minifyCss,
  parseClassList,
  parseCssRules,
  sanitizeCssForPreview,
  serializeCssRules,
  splitDeclarations,
} from "./CssValueCodec.js";
import type { ICssDeclaration, ICssIssue, ICssRule, TCssParameterKind } from "./CssValueCodec.js";
import type { IFunctionalityParameterSpec } from "./FunctionalityConfigEditor.js";
// #endregion Imports

/**
 * The popup editor for **CSS parameters** — the counterpart of `CsvGridEditor` for `type: "css"`.
 *
 * A CSS parameter is much more than a string, so this editor covers all four flavours declared via
 * `cssKind` (see {@link cssKindOf }):
 *
 * | kind           | example parameter                        | editor |
 * |----------------|------------------------------------------|--------|
 * | `stylesheet`   | `HTML.CSS.CSS`                           | rule grid + text editor + preview |
 * | `declarations` | `HTML.Panel.CSSHeaderUnfolded`, `CSSProposals` | property/value grid + text editor |
 * | `classes`      | `DQ.Table.View.CSS`                      | class chips |
 * | `selector`     | `Print.Remove.DocumentSelector`          | selector field + live match count |
 *
 * Two CodBi specifics are handled end-to-end by `CssValueCodec`:
 * - a value containing a comma is stored with a leading `^`, otherwise the attribute processor would
 *   split it into an array;
 * - `HTML.CSS` stores braces as `<`/`>` (and `,` as `§`), so the editor shows real braces and converts
 *   them back on apply unless the user explicitly opts out.
 */

// #region Brand & layout constants
/** CodBi accent used for the popup chrome (matches the CSV editor / EP builder). */
const ACCENT = "darkorange";

/** Absolute URL of the CodBi logo served by the plugin's `Resource` servlet. */
const CODBI_LOGO_URL = (() => {
  const baseURL = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const path = encodeURIComponent("/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg");

  return `${baseURL}plugin?name=Resource&Path=${path}`;
})();

/** localStorage key of the persisted popup geometry. */
const GEOMETRY_KEY = "codbi-csse-geometry";

/** Minimum popup size. */
const MIN_W = 720;
const MIN_H = 420;

/** Distance from a viewport edge that triggers docking. */
const DOCK_MARGIN = 8;

/** Distance from a viewport edge that triggers a window-style snap on drag release. */
const SNAP_MARGIN = 12;
// #endregion Brand & layout constants

// #region Stylesheet
/** The popup's embedded stylesheet (self-contained, so the host designer CSS cannot break it). */
const EDITOR_CSS = `
.codbi-csse{--csse-accent:${ACCENT};font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;font-size:12px;color:#172b4d}
/* Darkorange scrollbars, exactly like the Form Assistant's change-log listing. */
.codbi-csse,.codbi-csse *{scrollbar-color:#ff9f40 transparent;scrollbar-width:thin}
.codbi-csse ::-webkit-scrollbar,.codbi-csse::-webkit-scrollbar{width:10px;height:10px}
.codbi-csse ::-webkit-scrollbar-track,.codbi-csse::-webkit-scrollbar-track{background:transparent}
.codbi-csse ::-webkit-scrollbar-thumb,.codbi-csse::-webkit-scrollbar-thumb{background:#ff9f40;border-radius:5px}
.codbi-csse ::-webkit-scrollbar-thumb:hover,.codbi-csse::-webkit-scrollbar-thumb:hover{background:#ffb266}
.codbi-csse ::-webkit-scrollbar-corner,.codbi-csse::-webkit-scrollbar-corner{background:transparent}
.codbi-csse-overlay{position:fixed;inset:0;z-index:100000;background:rgba(9,30,66,.42)}
.codbi-csse-popup{position:fixed;display:flex;flex-direction:column;background:#fff;border:2px solid var(--csse-accent);border-radius:8px;box-shadow:0 12px 36px rgba(0,0,0,.45);overflow:hidden}
.codbi-csse-logo{width:18px;height:18px;flex:0 0 auto;object-fit:contain;pointer-events:none}
.codbi-csse-head{position:relative;z-index:3;display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,165,0,.14);border-bottom:1px solid #f0d3a4;cursor:move;user-select:none}
.codbi-csse-head b{font-size:13px}
.codbi-csse-sub{color:#6b778c;font-size:11px}
.codbi-csse-headbtn{margin-left:auto;border:0;background:transparent;color:#925400;font-size:14px;line-height:1;cursor:pointer;padding:3px 6px;border-radius:4px}
.codbi-csse-headbtn:hover{background:rgba(255,140,0,.2)}
.codbi-csse-close{margin-left:4px;border:0;background:transparent;color:#925400;font-size:16px;line-height:1;cursor:pointer;padding:2px 6px;border-radius:4px}
.codbi-csse-close:hover{background:rgba(255,140,0,.2)}
.codbi-csse-popup--max{border-radius:0;border-width:0;box-shadow:none}
.codbi-csse-popup--max .codbi-csse-resizer{display:none}
.codbi-csse-tabs{position:relative;z-index:3;display:flex;gap:4px;padding:6px 10px 0}
.codbi-csse-tab{border:1px solid transparent;border-bottom:0;border-radius:6px 6px 0 0;background:transparent;color:#42526e;font:inherit;font-weight:600;padding:5px 12px;cursor:pointer}
.codbi-csse-tab[aria-selected="true"]{background:#fff;border-color:#f0d3a4;color:#925400;box-shadow:0 -2px 0 var(--csse-accent) inset}
.codbi-csse-toolbar{position:relative;z-index:3;display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 10px;border-bottom:1px solid #f0d3a4;background:#fffdf8}
.codbi-csse-btn{border:1px solid #c1c7d0;border-radius:4px;background:#fff;color:#172b4d;font:inherit;padding:4px 10px;cursor:pointer;white-space:nowrap}
.codbi-csse-btn:hover{background:#f4f5f7}
.codbi-csse-btn--primary{background:var(--csse-accent);border-color:var(--csse-accent);color:#fff;font-weight:700}
.codbi-csse-btn--primary:hover{background:#ff8c00}
.codbi-csse-btn--warn{border-color:#de350b;color:#de350b}
.codbi-csse-content{position:relative;z-index:2;display:flex;flex:1 1 auto;min-height:0}
.codbi-csse-main{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;padding:8px 10px;overflow:auto}
.codbi-csse-side{flex:0 0 300px;display:flex;flex-direction:column;gap:6px;border-left:1px solid #f0d3a4;padding:8px 10px;overflow:auto;background:#fcfcfd}
.codbi-csse-splitter{flex:0 0 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:#fafbfc;border-left:1px solid #f0d3a4;cursor:col-resize;touch-action:none;user-select:none}
.codbi-csse-splitter:hover{background:#fff4e0}
.codbi-csse-splitbtn{border:1px solid #c1c7d0;background:#fff;border-radius:3px;color:#925400;font:10px/1 system-ui,sans-serif;cursor:pointer;padding:2px 3px;z-index:1}
.codbi-csse-splitbtn:hover{background:#fff4e0;border-color:#925400}
.codbi-csse-updatebtn{border:1px solid #c1c7d0;background:#fff;color:#42526e;border-radius:3px;font:10px/1 system-ui,sans-serif;cursor:pointer;padding:3px 6px;margin-left:auto}
.codbi-csse-updatebtn:hover{background:#f4f5f7}
.codbi-csse-updatebtn--dirty{background:darkorange;border-color:darkorange;color:#fff;font-weight:700}
.codbi-csse-updatebtn--dirty:hover{background:#ff8c00}
.codbi-csse-editor{position:relative;display:flex;flex:1 1 auto;min-height:160px;border:1px solid #e6cf9a;border-radius:4px;overflow:hidden;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;line-height:18px}
.codbi-csse-gutter{flex:0 0 auto;padding:6px 6px 6px 8px;text-align:right;color:#97a0af;background:#fafbfc;border-right:1px solid #e6cf9a;white-space:pre;overflow:hidden;user-select:none}
.codbi-csse-textarea{flex:1 1 auto;min-width:0;border:0;outline:none;resize:none;padding:6px 8px;font:inherit;line-height:inherit;color:inherit;background:transparent;tab-size:2;white-space:pre;overflow:auto}
.codbi-csse-textarea:focus{background:rgba(255,165,0,.04)}
.codbi-csse-ac{position:fixed;z-index:100002;min-width:160px;max-height:180px;overflow:auto;background:#fff;border:1px solid var(--csse-accent);border-radius:4px;box-shadow:0 6px 18px rgba(0,0,0,.25);padding:2px}
.codbi-csse-ac button{display:block;width:100%;text-align:left;border:0;background:transparent;font:inherit;padding:3px 8px;cursor:pointer;border-radius:3px;white-space:nowrap}
.codbi-csse-ac button[aria-selected="true"],.codbi-csse-ac button:hover{background:rgba(255,140,0,.18)}
.codbi-csse-table{width:100%;border-collapse:collapse;table-layout:auto}
.codbi-csse-table th,.codbi-csse-table td{border:1px solid #e6cf9a;padding:3px 5px;vertical-align:middle;text-align:left}
.codbi-csse-table th{background:rgba(255,165,0,.12);font-weight:600;white-space:nowrap}
.codbi-csse-cell{display:flex;align-items:center;gap:4px}
.codbi-csse-input{flex:1 1 auto;min-width:0;box-sizing:border-box;border:1px solid #e6cf9a;border-radius:3px;padding:3px 6px;font:inherit;color:inherit;background:transparent}
.codbi-csse-input:focus{outline:2px solid var(--csse-accent);outline-offset:-1px}
.codbi-csse-input--mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.codbi-csse-input--bad{border-color:#de350b;background:rgba(222,53,11,.05)}
.codbi-csse-swatch{width:18px;height:18px;flex:0 0 auto;border-radius:4px;border:1px solid #c1c7d0;cursor:pointer;padding:0;background-clip:padding-box}
.codbi-csse-colorchip{position:absolute;right:10px;bottom:8px;width:22px;height:22px;border-radius:4px;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.55);cursor:pointer;padding:0;z-index:5}
.codbi-csse-icon{border:0;background:transparent;color:#925400;font:inherit;cursor:pointer;padding:1px 4px;border-radius:3px}
.codbi-csse-icon:hover{background:rgba(255,140,0,.18)}
.codbi-csse-icon--del{color:#de350b}
.codbi-csse-add{display:inline-flex;align-items:center;gap:6px;margin-top:8px;border:1px dashed var(--csse-accent);background:#fff;color:var(--csse-accent);border-radius:4px;padding:4px 10px;font:inherit;font-weight:600;cursor:pointer}
.codbi-csse-add:hover{background:#fff4e0}
.codbi-csse-chips{display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start}
.codbi-csse-chip{display:inline-flex;align-items:center;gap:4px;border:1px solid #f0d3a4;background:rgba(255,165,0,.1);border-radius:999px;padding:2px 4px 2px 10px;font-family:ui-monospace,Menlo,Consolas,monospace}
.codbi-csse-chip button{border:0;background:transparent;color:#925400;cursor:pointer;font:inherit;padding:0 4px}
.codbi-csse-hint{color:#6b778c;font-size:11px;line-height:1.45}
.codbi-csse-issues{display:flex;flex-direction:column;gap:3px;max-height:180px;overflow:auto}
.codbi-csse-issue{display:flex;gap:6px;align-items:flex-start;text-align:left;border:1px solid #e6cf9a;border-radius:4px;background:#fff;padding:3px 6px;font:inherit;cursor:pointer}
.codbi-csse-issue:hover{background:#fffaf0}
.codbi-csse-issue--error{border-color:#de350b;background:rgba(222,53,11,.05)}
.codbi-csse-issue--warning{border-color:#ff991f;background:rgba(255,153,31,.07)}
.codbi-csse-issue--info{border-color:#4c9aff;background:rgba(76,154,255,.06)}
.codbi-csse-preview{flex:0 0 auto;height:210px;min-height:60px;border:1px solid #e6cf9a;border-radius:4px;background:#fff}
.codbi-csse-foot{position:relative;z-index:3;display:flex;align-items:center;gap:8px;padding:8px 10px;border-top:1px solid #f0d3a4;background:#fffdf8}
.codbi-csse-foot .codbi-csse-summary{color:#6b778c;margin-right:auto;font-size:11px}
.codbi-csse-resizer{position:absolute;z-index:6;touch-action:none;background:transparent}
.codbi-csse-resizer--se{right:0;bottom:0;width:20px;height:20px;cursor:nwse-resize}
.codbi-csse-resizer--nw{left:0;top:0;width:16px;height:16px;cursor:nwse-resize}
.codbi-csse-resizer--ne{right:0;top:0;width:16px;height:16px;cursor:nesw-resize}
.codbi-csse-resizer--sw{left:0;bottom:0;width:16px;height:16px;cursor:nesw-resize}
.codbi-csse-resizer--n{left:0;right:0;top:0;height:8px;cursor:ns-resize}
.codbi-csse-resizer--s{left:0;right:0;bottom:0;height:8px;cursor:ns-resize}
.codbi-csse-resizer--e{right:0;top:0;bottom:0;width:8px;cursor:ew-resize}
.codbi-csse-resizer--w{left:0;top:0;bottom:0;width:8px;cursor:ew-resize}
.codbi-csse-tooltip{position:fixed;z-index:2147483647;background:#1f2a44;color:#e6edf7;border:1px solid ${ACCENT};border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,.35);padding:6px 8px;font:12px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;max-width:520px;max-height:320px;overflow:auto;pointer-events:none}
.codbi-csse-tooltip pre{margin:4px 0 0;white-space:pre-wrap;word-break:break-word;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace}
`;
// #endregion Stylesheet

// #region Localization
/** The editor's user-facing strings. */
interface IEditorStrings {
  stylesheet: string;
  declarations: string;
  classes: string;
  selector: string;
  rulesTab: string;
  textTab: string;
  declarationsTab: string;
  classesTab: string;
  selectorTab: string;
  format: string;
  minify: string;
  copy: string;
  export: string;
  import: string;
  preview: string;
  issues: string;
  noIssues: string;
  find: string;
  fixBlocked: string;
  cancel: string;
  apply: string;
  addRule: string;
  addDeclaration: string;
  addClass: string;
  selectorPlaceholder: string;
  classPlaceholder: string;
  matches: string;
  pick: string;
  pickSelector: string;
  pickKeyframeStep: string;
  pickProperty: string;
  filterSelectors: string;
  filterKeyframeSteps: string;
  filterProperties: string;
  noMatches: string;
  highlightMatches: string;
  maximize: string;
  restore: string;
  updatePreview: string;
  updatePreviewDirty: string;
  previewNotReachable: string;
  previewNoTarget: string;
  gradient: string;
  color: string;
  dialectOn: string;
  dialectOff: string;
  draftRestored: string;
  escapedNotice: string;
  selectorHeader: string;
  bodyHeader: string;
  propertyHeader: string;
  valueHeader: string;
  actions: string;
}

/** English strings (the base locale). */
const STRINGS_EN: IEditorStrings = {
  stylesheet: "stylesheet",
  declarations: "declarations",
  classes: "CSS classes",
  selector: "CSS selector",
  rulesTab: "Rules",
  textTab: "Text",
  declarationsTab: "Declarations",
  classesTab: "Classes",
  selectorTab: "Selector",
  format: "Format",
  minify: "Minify",
  copy: "Copy",
  export: "Export .css",
  import: "Import .css",
  preview: "Preview",
  issues: "Issues",
  noIssues: "No problems found.",
  find: "Find (Ctrl+F)",
  fixBlocked: "Remove blocked",
  cancel: "Cancel",
  apply: "Apply",
  addRule: "Add rule",
  addDeclaration: "Add declaration",
  addClass: "Add class",
  selectorPlaceholder: "e.g. .xform input, #panel",
  classPlaceholder: "Class name (Enter to add)",
  matches: "matches",
  pick: "Pick element",
  pickSelector: "Choose a selector",
  pickKeyframeStep: "Choose a keyframe step",
  pickProperty: "Choose a property",
  filterSelectors: "Filter classes…",
  filterKeyframeSteps: "Filter steps…",
  filterProperties: "Filter properties…",
  noMatches: "No matches",
  highlightMatches: "Highlight matched elements",
  maximize: "Maximize",
  restore: "Restore",
  updatePreview: "Update preview",
  updatePreviewDirty: "Changes are not applied to the preview yet — click to update",
  previewNotReachable: "live preview not reachable",
  previewNoTarget: "element not found in the preview",
  gradient: "Gradient",
  color: "Color",
  dialectOn: "Store as <…> (HTML.CSS)",
  dialectOff: "Store real braces",
  draftRestored: "A local draft was restored. Apply or Cancel to discard it.",
  escapedNotice: "Contains a comma — stored with a leading '^' so it is not split into an array.",
  selectorHeader: "Selector",
  bodyHeader: "Declarations",
  propertyHeader: "Property",
  valueHeader: "Value",
  actions: "",
};

/** German strings. */
const STRINGS_DE: Partial<IEditorStrings> = {
  stylesheet: "Stylesheet",
  declarations: "Deklarationen",
  classes: "CSS-Klassen",
  selector: "CSS-Selektor",
  rulesTab: "Regeln",
  textTab: "Text",
  declarationsTab: "Deklarationen",
  classesTab: "Klassen",
  selectorTab: "Selektor",
  format: "Formatieren",
  minify: "Minifizieren",
  copy: "Kopieren",
  export: ".css exportieren",
  import: ".css importieren",
  preview: "Vorschau",
  issues: "Probleme",
  noIssues: "Keine Probleme gefunden.",
  find: "Suchen (Strg+F)",
  fixBlocked: "Blockiertes entfernen",
  cancel: "Abbrechen",
  apply: "Übernehmen",
  addRule: "Regel hinzufügen",
  addDeclaration: "Deklaration hinzufügen",
  addClass: "Klasse hinzufügen",
  selectorPlaceholder: "z. B. .xform input, #panel",
  classPlaceholder: "Klassenname (Enter zum Hinzufügen)",
  matches: "Treffer",
  pick: "Element wählen",
  pickSelector: "Selektor wählen",
  pickKeyframeStep: "Keyframe-Schritt wählen",
  pickProperty: "Eigenschaft wählen",
  filterSelectors: "Klassen filtern…",
  filterKeyframeSteps: "Schritte filtern…",
  filterProperties: "Eigenschaften filtern…",
  noMatches: "Keine Treffer",
  highlightMatches: "Treffer hervorheben",
  maximize: "Maximieren",
  restore: "Wiederherstellen",
  updatePreview: "Vorschau aktualisieren",
  updatePreviewDirty: "Änderungen sind noch nicht in der Vorschau — zum Aktualisieren klicken",
  previewNotReachable: "Live-Vorschau nicht erreichbar",
  previewNoTarget: "Element in der Vorschau nicht gefunden",
  gradient: "Farbverlauf",
  color: "Farbe",
  dialectOn: "Als <…> speichern (HTML.CSS)",
  dialectOff: "Echte Klammern speichern",
  draftRestored: "Ein lokaler Entwurf wurde wiederhergestellt. Übernehmen oder Abbrechen verwirft ihn.",
  escapedNotice: "Enthält ein Komma — wird mit führendem '^' gespeichert, damit es nicht in ein Array zerlegt wird.",
  selectorHeader: "Selektor",
  bodyHeader: "Deklarationen",
  propertyHeader: "Eigenschaft",
  valueHeader: "Wert",
};

/** @returns the strings for the current designer language. */
function strings(): IEditorStrings {
  const lang = getDesignerLanguage().toLowerCase();
  return lang === "de" ? { ...STRINGS_EN, ...STRINGS_DE } : STRINGS_EN;
}
// #endregion Localization

// #region Completions
/** Every CSS property the property picker of the declaration grid offers (already alphabetical). */
const CSS_PROPERTY_CANDIDATES: ReadonlyArray<string> = knownProperties();

/**
 * The keyframe steps the rule grid's picker offers (`from`, `to` and every tenth of the animation).
 *
 * A `declarations` parameter may hold keyframe STEPS instead of declarations (see
 * {@link isKeyframeSteps}); its "selector" is a step, so offering the form's CSS classes there is
 * meaningless.
 */
const KEYFRAME_STEP_CANDIDATES: ReadonlyArray<string> = [
  "from",
  "to",
  ...Array.from({ length: 11 }, (_, index) => `${index * 10}%`),
];

/** Value keywords offered by the completion popup in value position. */
const VALUE_KEYWORDS: ReadonlyArray<string> = [
  "auto",
  "none",
  "inherit",
  "initial",
  "unset",
  "block",
  "inline",
  "inline-block",
  "inline-flex",
  "flex",
  "grid",
  "absolute",
  "relative",
  "fixed",
  "sticky",
  "static",
  "center",
  "left",
  "right",
  "top",
  "bottom",
  "space-between",
  "space-around",
  "flex-start",
  "flex-end",
  "stretch",
  "baseline",
  "bold",
  "normal",
  "italic",
  "underline",
  "uppercase",
  "lowercase",
  "capitalize",
  "transparent",
  "currentColor",
  "solid",
  "dashed",
  "dotted",
  "hidden",
  "visible",
  "pointer",
  "default",
  "nowrap",
  "wrap",
  "border-box",
  "content-box",
  "ease-in-out",
  "rgba(",
  "rgb(",
  "var(--",
  "calc(",
  "1px",
  "1em",
  "1rem",
  "100%",
  "darkorange",
];

/** One pending completion offer. */
interface ICompletion {
  /** The candidates (already filtered). */
  items: string[];
  /** The index in the value at which the replacement starts. */
  start: number;
  /** The index in the value at which the replacement ends. */
  end: number;
}

/**
 * Computes the completions for the caret position of a CSS-ish input.
 *
 * @param value - The input's current value.
 * @param caret - The caret index.
 * @returns The offer, or null when there is nothing to suggest.
 */
function completionAt(value: string, caret: number): ICompletion | null {
  const before = value.slice(0, Math.max(0, caret));
  const wordMatch = /(--[-\w]*|[-a-zA-Z]+)$/.exec(before);
  const partial = wordMatch ? wordMatch[1] : "";
  if (partial.length === 0) {
    return null;
  }

  const start = caret - partial.length;
  const head = value.slice(0, start);
  const lastBoundary = Math.max(head.lastIndexOf(";"), head.lastIndexOf("{"), head.lastIndexOf("}"));
  const segment = head.slice(lastBoundary + 1);
  const inValue = segment.includes(":");
  const pool = inValue ? VALUE_KEYWORDS : knownProperties();
  const lower = partial.toLowerCase();
  const items = pool.filter((item) => item.toLowerCase().startsWith(lower) && item !== partial).slice(0, 12);

  return items.length > 0 ? { items, start, end: caret } : null;
}
// #endregion Snippets & completions

// #region Selector candidates
/** Class-name prefixes that belong to the CodBi/editor chrome and must never be offered. */
const CHROME_CLASS_PREFIXES: ReadonlyArray<string> = ["codbi-", "codbi_", "cb-"];

/**
 * Collects the CSS classes that actually occur in a document, so the rule/selector pickers can offer
 * them as `.class` selectors. FORMCYCLE renders the widget class names (`XTextField`, `XContainer`, …)
 * and the author's own `cssclasses` onto the elements, so this covers both.
 *
 * @param source - The document to scan (usually the canvas document holding the rendered form).
 * @param limit  - The maximum number of candidates.
 * @returns The distinct `.class` selectors, sorted.
 */
export function collectSelectorCandidates(source: Document, limit = 500): string[] {
  const found = new Set<string>();

  for (const element of Array.from(source.querySelectorAll<HTMLElement>("[class]"))) {
    if (element.closest(".codbi-csse-overlay")) {
      continue;
    }
    for (const name of Array.from(element.classList)) {
      if (name === "" || name.length > 64) {
        continue;
      }
      if (CHROME_CLASS_PREFIXES.some((prefix) => name.startsWith(prefix))) {
        continue;
      }
      found.add(`.${name}`);
    }
  }

  return Array.from(found)
    .sort((left, right) => left.localeCompare(right))
    .slice(0, limit);
}
// #endregion Selector candidates

// #region Options
/**
 * The spec the CSS editor understands: the generic parameter spec, which already carries the
 * `cssKind` discriminator and the optional per-parameter `snippets`.
 */
export type ICssParameterSpec = IFunctionalityParameterSpec;

/** Options accepted by {@link openCssEditor }. */
export interface ICssEditorOptions {
  /** The document the popup shall be rendered into (usually the canvas iframe's document). */
  document: Document;
  /** An element inside the target document (used to locate its viewport). */
  anchor: HTMLElement;
  /** The parameter whose value is edited — shown in bold in the header. */
  parameterName?: string;
  /**
   * The form element the parameter belongs to. When given, the clone-based preview renders ONLY that
   * element (with the edited CSS applied) instead of the whole form.
   */
  previewRoot?: HTMLElement | null;
  /**
   * The FORMCYCLE **designer preview URL** (see `designerPreviewUrl()`), i.e. the SAME page the
   * element preview switch loads. When given, the preview uses that real, fully rendered form and
   * injects the edited CSS into it live — far more faithful than any cloned markup.
   */
  previewSrc?: string;
  /** The designer item id of the element being styled (used to scroll/focus it in the live preview). */
  previewElementId?: string;
  /**
   * Clips the live preview to the element (and hides the platform's preview chrome / menu) — the same
   * routine the element preview switch uses (`clipPreviewToElement` in `CodbiElementMarkers`).
   *
   * @param frame     - The live preview iframe.
   * @param elementId - The designer item id of the styled element.
   * @returns Whether the preview could be clipped.
   */
  previewClip?: (frame: HTMLIFrameElement, elementId: string) => boolean;
  /** The current parameter value (may still carry the `^` escape). */
  value: unknown;
  /** The parameter's spec (`cssKind` drives the editor mode). */
  spec?: ICssParameterSpec;
  /** Invoked with the encoded value when the user confirms. */
  onApply: (value: string) => void;
  /** Class names offered as completions in `classes` / `selector` mode. */
  knownClasses?: ReadonlyArray<string>;
}
// #endregion Options

// #region Geometry
/** The popup geometry. */
interface IGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** @returns the geometry clamped to the current viewport. */
function clampGeometry(geom: IGeometry): IGeometry {
  const width = Math.max(MIN_W, Math.min(geom.width, window.innerWidth));
  const height = Math.max(MIN_H, Math.min(geom.height, window.innerHeight));

  return {
    width,
    height,
    left: Math.max(0, Math.min(geom.left, window.innerWidth - width)),
    top: Math.max(0, Math.min(geom.top, window.innerHeight - height)),
  };
}

/** @returns the default (centered) geometry. */
function defaultGeometry(): IGeometry {
  const width = Math.max(MIN_W, Math.min(980, window.innerWidth * 0.92));
  const height = Math.max(MIN_H, Math.min(660, window.innerHeight * 0.88));

  return { width, height, left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2 };
}

/** @returns the persisted geometry (or the default). */
function loadGeometry(): IGeometry {
  try {
    const raw = localStorage.getItem(GEOMETRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<IGeometry>;
      if (
        typeof parsed.left === "number" &&
        typeof parsed.top === "number" &&
        typeof parsed.width === "number" &&
        typeof parsed.height === "number"
      ) {
        return clampGeometry(parsed as IGeometry);
      }
    }
  } catch {
    /* ignore a corrupt/unavailable storage */
  }
  return defaultGeometry();
}

/** Persists the geometry. */
function saveGeometry(geom: IGeometry): void {
  try {
    localStorage.setItem(GEOMETRY_KEY, JSON.stringify(geom));
  } catch {
    /* ignore */
  }
}
// #endregion Geometry

// #region Tooltip
/**
 * Attaches a rich hover tooltip to a CSS launcher button: the summary plus the first lines of the
 * current value in a monospace block. The getter is re-read on every `mouseenter`, so it always
 * reflects the latest attribute value.
 *
 * @param button     - The launcher button.
 * @param getValue   - Returns the current (stored) value.
 * @param summary    - The summary line shown in the tooltip header.
 */
export function attachCssValueTooltip(button: HTMLElement, getValue: () => string, summary: string): void {
  const doc = button.ownerDocument;
  let tooltip: HTMLDivElement | null = null;
  let hideTimer: number | undefined;

  const show = (): void => {
    if (hideTimer !== undefined) {
      window.clearTimeout(hideTimer);
      hideTimer = undefined;
    }
    if (tooltip) {
      tooltip.remove();
    }
    const { text } = decodeCssValue(getValue());
    tooltip = doc.createElement("div");
    tooltip.className = "codbi-csse codbi-csse-tooltip";

    const head = doc.createElement("div");
    head.style.cssText = "color:#ffb347;font-weight:700;white-space:nowrap;";
    head.textContent = summary;
    tooltip.appendChild(head);

    const lines = text.split(/\r?\n/);
    const shown = lines.slice(0, 18);
    const pre = doc.createElement("pre");
    pre.textContent =
      shown.join("\n") + (lines.length > shown.length ? `\n… (+${lines.length - shown.length} lines)` : "");
    tooltip.appendChild(pre);

    doc.body.appendChild(tooltip);
    const rect = button.getBoundingClientRect();
    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, rect.right - width);
    }
    if (top + height > window.innerHeight - 8) {
      top = Math.max(8, rect.top - height - 6);
    }
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const hide = (): void => {
    hideTimer = window.setTimeout(() => {
      tooltip?.remove();
      tooltip = null;
    }, 80);
  };

  button.addEventListener("mouseenter", show);
  button.addEventListener("mouseleave", hide);
  button.addEventListener("focus", show);
  button.addEventListener("blur", hide);
}
// #endregion Tooltip

// #region Small DOM helpers
/**
 * Creates an element.
 *
 * @param doc  - The document.
 * @param tag  - The tag name.
 * @param css  - Optional inline CSS (`cssText`).
 * @param text - Optional text content.
 * @returns The element.
 */
function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  css?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag);
  if (css) {
    node.style.cssText = css;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

/**
 * Creates a button.
 *
 * @param doc   - The document.
 * @param label - The label.
 * @param css   - Optional inline CSS.
 * @returns The button.
 */
function mkButton(doc: Document, label: string, css?: string): HTMLButtonElement {
  const button = el(doc, "button", css, label);
  button.type = "button";
  return button;
}
// #endregion Small DOM helpers

// #region Editor
/**
 * Opens the CSS editor popup for one CSS parameter and applies the encoded result.
 *
 * @param options - The editor options (see {@link ICssEditorOptions }).
 */
export function openCssEditor(options: ICssEditorOptions): void {
  const doc = options.document;
  const spec = options.spec;
  const labels = strings();
  const kind: TCssParameterKind = cssKindOf(spec);

  const decoded = decodeCssValue(options.value);
  /** Whether the value was stored with the `^` escape (informational). */
  const wasEscaped = decoded.escaped;
  /** Whether the CodBi angle-bracket dialect is used when storing (stylesheet only). */
  const dialect = kind === "stylesheet";

  /**
   * @param value - The decoded value.
   * @returns The same value PRETTIFIED (one declaration per line, one rule per block).
   *
   * A parameter is commonly stored as one long line (`position : relative ; box-shadow : …`), which is
   * unreadable in the text view. CSS whitespace is insignificant, so the editor simply works on the
   * formatted text — the value applied at the end is that formatted text. A class list / selector list
   * is left untouched (formatting it would destroy the comma-separated list) — and so is a value that
   * does NOT parse: formatting would silently "repair" it (e.g. close a missing brace) and hide the
   * very error the author has to see.
   */
  const prettyText = (value: string): string => {
    if (kind !== "stylesheet" && kind !== "declarations") {
      return value;
    }
    if (lintCss(value, kind).some((issue) => issue.severity === "error")) {
      return value;
    }
    return formatCss(value, kind);
  };

  // The editor always works on the DISPLAY form (real braces); the dialect is applied on apply.
  const initialText = prettyText(kind === "stylesheet" ? dialectToBraces(decoded.text) : decoded.text);

  // The editor ALWAYS starts from the value it was opened with. (A localStorage draft used to be
  // restored here, keyed by a shared "css" bucket — so one parameter's draft leaked into the next one
  // and a parameter with real declarations opened with another parameter's text.)
  const state = {
    kind,
    text: initialText,
    classes: parseClassList(initialText),
    dialect,
    view: "text" as TView,
  };

  // #region Style element (created once per document)
  let styleEl = doc.head?.querySelector<HTMLStyleElement>("style[data-codbi-csse]");
  if (!styleEl) {
    styleEl = doc.createElement("style");
    styleEl.setAttribute("data-codbi-csse", "");
    styleEl.textContent = EDITOR_CSS;
    doc.head?.appendChild(styleEl);
  }
  // #endregion Style element

  // #region Shell
  const overlay = el(doc, "div");
  overlay.className = "codbi-csse codbi-csse-overlay";

  const popup = el(doc, "div");
  popup.className = "codbi-csse-popup";

  const granularity =
    kind === "stylesheet"
      ? labels.stylesheet
      : kind === "declarations"
        ? labels.declarations
        : kind === "classes"
          ? labels.classes
          : labels.selector;
  const head = el(doc, "div");
  head.className = "codbi-csse-head";
  // The CodBi logo lives IN the header (no faint background watermark behind the editor).
  const logo = el(doc, "img");
  logo.className = "codbi-csse-logo";
  logo.src = CODBI_LOGO_URL;
  logo.alt = "CodBi";
  const title = el(doc, "b", "", "CSS Editor");
  // Instead of the kind, the header names the PARAMETER whose value is being edited (bold).
  const sub = el(doc, "b", "", options.parameterName ?? granularity);
  sub.className = "codbi-csse-sub";
  sub.style.color = "#172b4d";
  sub.style.fontSize = "12px";
  sub.title = granularity;
  const maxBtn = mkButton(doc, "⛶");
  maxBtn.className = "codbi-csse-headbtn";
  maxBtn.title = labels.maximize;
  maxBtn.setAttribute("aria-label", labels.maximize);
  const closeBtn = mkButton(doc, "✕");
  closeBtn.className = "codbi-csse-close";
  closeBtn.title = labels.cancel;
  head.append(logo, title, sub, maxBtn, closeBtn);
  // Double-clicking the header toggles maximize, like a desktop dialog.
  head.addEventListener("dblclick", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button")) {
      return;
    }
    setMaximized(!maximized);
  });

  const tabStrip = el(doc, "div");
  tabStrip.className = "codbi-csse-tabs";

  const toolbar = el(doc, "div");
  toolbar.className = "codbi-csse-toolbar";

  const content = el(doc, "div");
  content.className = "codbi-csse-content";

  const main = el(doc, "div");
  main.className = "codbi-csse-main";

  const side = el(doc, "div");
  side.className = "codbi-csse-side";

  const foot = el(doc, "div");
  foot.className = "codbi-csse-foot";
  const summaryEl = el(doc, "span", "", "");
  summaryEl.className = "codbi-csse-summary";
  const cancelBtn = mkButton(doc, labels.cancel);
  cancelBtn.className = "codbi-csse-btn";
  const applyBtn = mkButton(doc, labels.apply);
  applyBtn.className = "codbi-csse-btn codbi-csse-btn--primary";
  foot.append(summaryEl, cancelBtn, applyBtn);

  // Split bar between the CSS editor (left) and the preview + issues (right): drag it, or jump it to
  // either side with the two arrows so one half can take (almost) the whole width.
  const splitter = el(doc, "div");
  splitter.className = "codbi-csse-splitter";
  splitter.title = "Drag to resize · arrows move the split";
  const jumpLeft = mkButton(doc, "◀");
  jumpLeft.className = "codbi-csse-splitbtn";
  jumpLeft.title = "Give the preview the whole width";
  const jumpRight = mkButton(doc, "▶");
  jumpRight.className = "codbi-csse-splitbtn";
  jumpRight.title = "Give the CSS editor the whole width";
  splitter.append(jumpLeft, jumpRight);

  const SPLIT_KEY = "codbi-csse-split";
  /** The persisted width (px) of the right-hand pane. */
  const loadSplit = (): number => {
    try {
      const raw = localStorage.getItem(SPLIT_KEY);
      const parsed = raw === null ? Number.NaN : Number(raw);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 300;
    } catch {
      return 300;
    }
  };
  let sideWidth = loadSplit();

  /** Applies (and persists) the right-hand pane width; `0` hides it entirely. */
  const applySplit = (px: number): void => {
    const available = content.clientWidth;
    const width = Math.round(available > 0 ? Math.max(0, Math.min(px, available)) : Math.max(0, px));
    sideWidth = width;
    side.style.display = width === 0 ? "none" : "";
    side.style.flex = width === 0 ? "0 0 0" : `0 0 ${width}px`;
    try {
      localStorage.setItem(SPLIT_KEY, String(width));
    } catch {
      /* ignore */
    }
  };
  applySplit(sideWidth);

  let splitDragging = false;
  splitter.addEventListener("pointerdown", (event) => {
    if ((event.target as HTMLElement | null)?.closest("button")) {
      return;
    }
    splitDragging = true;
    try {
      splitter.setPointerCapture(event.pointerId);
    } catch {
      /* not supported */
    }
    event.preventDefault();
  });
  const onSplitMove = (event: PointerEvent): void => {
    if (!splitDragging) {
      return;
    }
    const rect = content.getBoundingClientRect();
    applySplit(rect.right - event.clientX - 6);
  };
  const endSplit = (): void => {
    if (!splitDragging) {
      return;
    }
    splitDragging = false;
    refitPreview();
  };
  splitter.addEventListener("pointermove", onSplitMove);
  splitter.addEventListener("pointerup", endSplit);
  splitter.addEventListener("pointercancel", endSplit);

  jumpLeft.addEventListener("click", () => {
    // Split bar (almost) to the LEFT → the preview/issues pane takes nearly the whole width.
    applySplit(Math.round(content.clientWidth * 0.92));
    refitPreview();
  });
  jumpRight.addEventListener("click", () => {
    // Split bar (almost) to the RIGHT → the CSS editor takes nearly the whole width.
    applySplit(Math.round(content.clientWidth * 0.08));
    refitPreview();
  });

  content.append(main, splitter, side);
  popup.append(head, tabStrip, toolbar, content, foot);
  overlay.appendChild(popup);
  doc.body.appendChild(overlay);
  // #endregion Shell

  // #region Geometry wiring
  let geom = loadGeometry();
  /** The floating geometry restored when leaving the maximized state. */
  let restoreGeometry: IGeometry | null = null;
  /** Whether the popup currently fills the viewport. */
  let maximized = false;

  /** Writes a geometry WITHOUT the minimum-size clamp (used by maximize / half-screen snapping). */
  const applyGeometryRaw = (next: IGeometry): void => {
    geom = next;
    popup.style.left = `${geom.left}px`;
    popup.style.top = `${geom.top}px`;
    popup.style.width = `${geom.width}px`;
    popup.style.height = `${geom.height}px`;
  };

  const applyGeometry = (next: IGeometry): void => {
    applyGeometryRaw(clampGeometry(next));
  };

  /** Maximizes / restores the popup (the Form Assistant dialog's maximize button equivalent). */
  function setMaximized(on: boolean): void {
    if (on === maximized) {
      return;
    }
    maximized = on;
    popup.classList.toggle("codbi-csse-popup--max", on);
    if (on) {
      restoreGeometry = geom;
      geom = { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      popup.style.left = "0px";
      popup.style.top = "0px";
      popup.style.width = `${geom.width}px`;
      popup.style.height = `${geom.height}px`;
    } else {
      const back = restoreGeometry ?? defaultGeometry();
      restoreGeometry = null;
      applyGeometry(back);
      saveGeometry(geom);
    }
    maxBtn.textContent = on ? "❐" : "⛶";
    maxBtn.title = on ? labels.restore : labels.maximize;
    maxBtn.setAttribute("aria-label", maxBtn.title);
    // Re-fit the preview: its size changed with the panel (the applied CSS stays as it is).
    refitPreview();
  }

  applyGeometry(geom);

  let dragging = false;
  let dragDX = 0;
  let dragDY = 0;
  head.addEventListener("pointerdown", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("button, input, select, textarea, a")) {
      return;
    }
    const rect = popup.getBoundingClientRect();
    // Grabbing a maximized popup restores it first (like a maximized desktop window) and keeps the
    // pointer at the same relative X position.
    const ratio = rect.width > 0 ? (event.clientX - rect.left) / rect.width : 0.5;
    if (maximized) {
      setMaximized(false);
    }
    const live = popup.getBoundingClientRect();
    dragging = true;
    dragDX = Math.max(0, Math.min(live.width - 1, live.width * ratio));
    dragDY = Math.max(0, Math.min(live.height - 1, event.clientY - live.top));
    event.preventDefault();
  });
  const onDragMove = (event: PointerEvent): void => {
    if (!dragging) {
      return;
    }
    const rect = popup.getBoundingClientRect();
    const left = Math.max(0, Math.min(event.clientX - dragDX, window.innerWidth - rect.width));
    const top = Math.max(0, Math.min(event.clientY - dragDY, window.innerHeight - rect.height));
    applyGeometry({ left, top, width: rect.width, height: rect.height });
  };
  /**
   * Applies the Windows-style snap zone the popup was dragged into: touching the top edge maximizes,
   * touching the left/right edge docks the popup to that half of the screen.
   *
   * The POPUP's rectangle decides this — not the pointer: while dragging by the header the pointer
   * stays `dragDX` pixels inside the window, so a pointer-based test never saw the left/right edge.
   *
   * @returns Whether a snap was applied.
   */
  const snapFromRect = (): boolean => {
    const rect = popup.getBoundingClientRect();
    if (rect.top <= SNAP_MARGIN) {
      setMaximized(true);
      return true;
    }
    // Half-screen docking bypasses MIN_W: on a narrow window half the viewport is smaller than the
    // minimum floating width, which would otherwise silently "cancel" the snap.
    const half = Math.max(320, Math.round(window.innerWidth / 2));
    if (rect.left <= SNAP_MARGIN) {
      applyGeometryRaw({ left: 0, top: 0, width: half, height: window.innerHeight });
      saveGeometry(geom);
      return true;
    }
    if (rect.right >= window.innerWidth - SNAP_MARGIN) {
      applyGeometryRaw({
        left: window.innerWidth - half,
        top: 0,
        width: half,
        height: window.innerHeight,
      });
      saveGeometry(geom);
      return true;
    }
    return false;
  };
  const onDragEnd = (): void => {
    if (!dragging) {
      return;
    }
    dragging = false;
    if (!snapFromRect()) {
      saveGeometry(geom);
    }
  };
  // Document-level listeners so the popup keeps following the pointer outside the header bar.
  doc.addEventListener("pointermove", onDragMove, true);
  doc.addEventListener("pointerup", onDragEnd, true);
  doc.addEventListener("pointercancel", onDragEnd, true);

  const RESIZE_DIRS = ["n", "s", "e", "w", "ne", "nw", "se", "sw"] as const;
  for (const dir of RESIZE_DIRS) {
    const handle = el(doc, "div");
    handle.className = `codbi-csse-resizer codbi-csse-resizer--${dir}`;
    handle.dataset.dir = dir;
    let resizing = false;
    let startX = 0;
    let startY = 0;
    let startRect: IGeometry = geom;

    /** Applies one resize step from the stored start rect, keeping the grabbed edge under the pointer. */
    const onMove = (event: PointerEvent): void => {
      if (!resizing) {
        return;
      }
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      let { left, top, width, height } = startRect;
      if (dir.includes("w")) {
        width = Math.max(MIN_W, Math.min(startRect.width - dx, startRect.left + startRect.width));
        left = startRect.left + (startRect.width - width);
      } else if (dir.includes("e")) {
        width = Math.max(MIN_W, Math.min(startRect.width + dx, window.innerWidth - startRect.left));
      }
      if (dir.includes("n")) {
        height = Math.max(MIN_H, Math.min(startRect.height - dy, startRect.top + startRect.height));
        top = startRect.top + (startRect.height - height);
      } else if (dir.includes("s")) {
        height = Math.max(MIN_H, Math.min(startRect.height + dy, window.innerHeight - startRect.top));
      }
      applyGeometry({ left, top, width, height });
    };
    /** Ends the resize and persists the final geometry. */
    const endResize = (event: PointerEvent): void => {
      if (!resizing) {
        return;
      }
      resizing = false;
      doc.removeEventListener("pointermove", onMove, true);
      doc.removeEventListener("pointerup", endResize, true);
      doc.removeEventListener("pointercancel", endResize, true);
      try {
        handle.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      saveGeometry(geom);
    };

    handle.addEventListener("pointerdown", (event) => {
      const rect = popup.getBoundingClientRect();
      startRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      resizing = true;
      startX = event.clientX;
      startY = event.clientY;
      // Capture the pointer AND track it on the document: the thin handle is left immediately while
      // dragging, which previously stopped the resize from following the cursor.
      try {
        handle.setPointerCapture(event.pointerId);
      } catch {
        /* not supported (e.g. jsdom) — the document listeners below still track the pointer */
      }
      doc.addEventListener("pointermove", onMove, true);
      doc.addEventListener("pointerup", endResize, true);
      doc.addEventListener("pointercancel", endResize, true);
      event.preventDefault();
      event.stopPropagation();
    });
    popup.appendChild(handle);
  }
  // #endregion Geometry wiring

  // #region Keyboard containment
  /** @returns whether a keyboard event originates inside the CSS editor's own UI. */
  const isEditorKeyboard = (event: Event): boolean => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return false;
    }
    if (overlay.contains(target)) {
      return true;
    }
    // The color picker / gradient builder and the selector picker are appended to `body`, outside the
    // popup, so they need their own check.
    const element = target instanceof Element ? target : (target.parentElement ?? null);
    return element?.closest(".codbi-cse-tools, .codbi-csse-picker") != null;
  };

  /**
   * Keeps the designer's GLOBAL shortcuts away from the editor's own inputs.
   *
   * Without this a Backspace inside a declaration's property field reached the designer's key handler
   * and deleted the selected ELEMENT (and the next one the PAGE). The listener runs in the BUBBLE
   * phase, so the event still reaches the input itself — it is only stopped before it propagates to
   * the document-level designer handlers (our own shortcuts live in the capture-phase `keyHandler`).
   *
   * @param event - The keyboard event.
   */
  const stopDesignerKeys = (event: Event): void => {
    if (isEditorKeyboard(event)) {
      event.stopPropagation();
    }
  };
  overlay.addEventListener("keydown", stopDesignerKeys);
  overlay.addEventListener("keyup", stopDesignerKeys);
  overlay.addEventListener("keypress", stopDesignerKeys);
  doc.body.addEventListener("keydown", stopDesignerKeys);
  doc.body.addEventListener("keyup", stopDesignerKeys);
  doc.body.addEventListener("keypress", stopDesignerKeys);
  // #endregion Keyboard containment

  // #region Live validation hooks
  /** Validates a selector against the document the popup lives in. */
  const validateSelector = (selector: string): string | null => {
    try {
      doc.querySelector(selector);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : "invalid selector";
    }
  };

  /** The currently collected issues (recomputed on every edit). */
  let issues: ICssIssue[] = [];

  const refreshIssues = (): void => {
    issues = lintCss(state.text, state.kind, validateSelector);
    if (wasEscaped) {
      issues = [
        ...issues,
        {
          severity: "info",
          message: labels.escapedNotice,
          line: 1,
        },
      ];
    }
    // Placeholder awareness: HTML.CSS replaces the `Replacements` / `Darkmode` tokens verbatim.
    if (state.kind === "stylesheet") {
      const placeholders = extractPlaceholders(state.text);
      if (placeholders.length > 0) {
        issues = [
          ...issues,
          {
            severity: "info",
            message: `Placeholders: ${placeholders.join(", ")}`,
            line: 1,
            hint: "Resolved through the HTML.CSS Replacements / Darkmode parameters (and their _DM variants).",
          },
        ];
      }
    }
  };
  // #endregion Live validation hooks

  // #region Text editor (shared by every kind)
  const editorBox = el(doc, "div");
  editorBox.className = "codbi-csse-editor";
  const gutter = el(doc, "div");
  gutter.className = "codbi-csse-gutter";
  const textarea = el(doc, "textarea");
  textarea.className = "codbi-csse-textarea";
  textarea.spellcheck = false;
  textarea.setAttribute("aria-label", "CSS");
  editorBox.append(gutter, textarea);

  /** Rebuilds the line-number gutter so it matches the value. */
  const syncGutter = (): void => {
    const lineCount = Math.max(1, textarea.value.split("\n").length);
    const numbers: string[] = [];
    for (let i = 1; i <= lineCount; i += 1) {
      numbers.push(String(i));
    }
    gutter.textContent = numbers.join("\n");
    gutter.scrollTop = textarea.scrollTop;
  };
  textarea.addEventListener("scroll", () => {
    gutter.scrollTop = textarea.scrollTop;
  });

  /** Focuses (and selects) the given 1-based line. */
  const gotoLine = (line: number): void => {
    const lines = textarea.value.split("\n");
    const index = Math.max(0, Math.min(nextLineStart(lines, line), textarea.value.length));
    textarea.focus();
    textarea.setSelectionRange(index, index);
  };

  // #region Completions
  let acBox: HTMLElement | null = null;
  let acState: { items: string[]; start: number; end: number; index: number } | null = null;

  const closeCompletions = (): void => {
    acBox?.remove();
    acBox = null;
    acState = null;
  };

  /** Applies the currently highlighted completion. */
  const acceptCompletion = (): void => {
    if (!acState) {
      return;
    }
    const picked = acState.items[acState.index];
    if (picked === undefined) {
      closeCompletions();
      return;
    }
    const value = textarea.value;
    textarea.value = value.slice(0, acState.start) + picked + value.slice(acState.end);
    const caret = acState.start + picked.length;
    textarea.setSelectionRange(caret, caret);
    closeCompletions();
    commitText(textarea.value);
  };

  /** Highlights the candidate at `index`. */
  const selectCompletion = (index: number): void => {
    if (!acState || !acBox) {
      return;
    }
    acState.index = (index + acState.items.length) % acState.items.length;
    const buttons = acBox.querySelectorAll("button");
    for (let i = 0; i < buttons.length; i += 1) {
      buttons[i].setAttribute("aria-selected", String(i === acState.index));
    }
  };

  /** Opens the completion list under the textarea for the current caret. */
  const openCompletions = (): void => {
    closeCompletions();
    const offer = completionAt(textarea.value, textarea.selectionStart ?? 0);
    if (!offer) {
      return;
    }
    acState = { ...offer, index: 0 };
    acBox = el(doc, "div");
    acBox.className = "codbi-csse-ac";
    for (const item of offer.items) {
      const option = mkButton(doc, item);
      option.setAttribute("aria-selected", "false");
      option.addEventListener("mousedown", (event) => {
        event.preventDefault();
        if (acState) {
          acState.index = acState.items.indexOf(item);
        }
        acceptCompletion();
      });
      acBox.appendChild(option);
    }
    doc.body.appendChild(acBox);
    const rect = textarea.getBoundingClientRect();
    acBox.style.left = `${rect.left + 24}px`;
    acBox.style.top = `${Math.min(rect.bottom + 2, window.innerHeight - 190)}px`;
    selectCompletion(0);
  };

  textarea.addEventListener("keydown", (event) => {
    if (acState && acBox) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectCompletion(acState.index + 1);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        selectCompletion(acState.index - 1);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        acceptCompletion();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeCompletions();
        return;
      }
    }

    // Ctrl/Cmd+Enter applies the value from anywhere in the editor.
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      commitAndApply();
      return;
    }

    // Tab indents instead of moving the focus.
    if (event.key === "Tab") {
      event.preventDefault();
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? start;
      textarea.value = `${textarea.value.slice(0, start)}  ${textarea.value.slice(end)}`;
      textarea.setSelectionRange(start + 2, start + 2);
      commitText(textarea.value);
    }
  });

  textarea.addEventListener("input", () => {
    commitText(textarea.value);
    openCompletions();
  });

  // Edge-DevTools-style color affordance: a swatch appears in the editor's corner while the caret sits
  // inside a color value; clicking it opens the color picker for exactly that token.
  const colorChip = mkButton(doc, "");
  colorChip.className = "codbi-csse-colorchip";
  colorChip.style.display = "none";
  editorBox.appendChild(colorChip);

  let chipToken: IColorToken | null = null;

  /** Shows the swatch for the color token the caret currently touches (hides it otherwise). */
  const refreshColorChip = (): void => {
    chipToken = colorTokenAt(state.text, textarea.selectionStart ?? 0);
    const parsed = chipToken ? parseColor(chipToken.text) : null;
    if (!chipToken || !parsed) {
      colorChip.style.display = "none";
      return;
    }
    colorChip.style.display = "inline-block";
    colorChip.style.background = swatchCss(parsed);
    colorChip.title = `${labels.color}: ${chipToken.text}`;
    colorChip.setAttribute("aria-label", labels.color);
  };

  colorChip.addEventListener("click", () => {
    const token = chipToken;
    if (!token) {
      return;
    }
    openColorPicker({
      document: doc,
      anchor: colorChip,
      value: token.text,
      onApply: (css) => {
        commitText(replaceColorToken(state.text, token, css));
        textarea.focus();
        textarea.setSelectionRange(token.start + css.length, token.start + css.length);
        refreshColorChip();
      },
    });
  });

  for (const type of ["keyup", "click", "input", "select"] as const) {
    textarea.addEventListener(type, refreshColorChip);
  }
  // #endregion Completions
  // #endregion Text editor

  // #region Rules view (stylesheet)
  const rulesView = el(doc, "div");
  const rulesTable = el(doc, "table");
  rulesTable.className = "codbi-csse-table";
  const rulesBody = el(doc, "tbody");

  /** Writes the rule list back into the shared text state. */
  const writeRules = (rules: ReadonlyArray<ICssRule>, rerenderGrid = true): void => {
    commitText(serializeCssRules(rules), rerenderGrid);
  };

  /** The open picker panel (at most one at a time) and the document listener that dismisses it. */
  let pickerPanel: HTMLElement | null = null;
  let pickerTeardown: (() => void) | null = null;

  /** Closes the picker (also used by the editor's own `close()` and on every view rebuild). */
  const closeSelectorPicker = (): void => {
    pickerTeardown?.();
    pickerTeardown = null;
    pickerPanel?.remove();
    pickerPanel = null;
  };

  /**
   * Opens the filterable picker under `anchorEl`. Picking an entry hands it to `onPick`; the text stays
   * fully editable, so any value can still be typed manually.
   *
   * @param anchorEl    - The element the panel is anchored to.
   * @param onPick      - Invoked with the picked entry.
   * @param candidates  - The entries to offer (defaults to the form's own CSS classes).
   * @param placeholder - The filter's placeholder (defaults to the class filter).
   */
  function openSelectorPicker(
    anchorEl: HTMLElement,
    onPick: (selector: string) => void,
    candidates?: ReadonlyArray<string>,
    placeholder?: string,
  ): void {
    closeSelectorPicker();
    const all = candidates ?? collectSelectorCandidates(formDocuments()[0] ?? doc);
    const panel = el(doc, "div");
    panel.className = "codbi-csse-ac codbi-csse-picker";
    panel.style.minWidth = "240px";
    // ONE scroll container: the shared `.codbi-csse-ac` rule scrolls the panel itself, which put a
    // second scrollbar around the (scrollable) list. The panel only hosts the filter + the list here.
    panel.style.overflow = "hidden";
    panel.style.maxHeight = "none";

    const filter = el(doc, "input");
    filter.type = "search";
    filter.className = "codbi-csse-input";
    filter.placeholder = placeholder ?? labels.filterSelectors;
    // Full width of the listing (the buttons are `width:100%`, the input is an inline control).
    filter.style.width = "100%";
    filter.style.boxSizing = "border-box";

    const list = el(doc, "div", "max-height:200px;overflow:auto;margin-top:4px");

    const fill = (): void => {
      list.replaceChildren();
      const needle = filter.value.trim().toLowerCase();
      const matches = all.filter((entry) => entry.toLowerCase().includes(needle)).slice(0, 200);
      if (matches.length === 0) {
        list.appendChild(el(doc, "div", "color:#6b778c;padding:4px 6px", labels.noMatches));
        return;
      }
      for (const entry of matches) {
        const option = mkButton(doc, entry);
        option.addEventListener("click", () => {
          // Close FIRST: picking re-renders the grid, and a throwing consumer must never leave the
          // popup behind.
          closeSelectorPicker();
          onPick(entry);
        });
        list.appendChild(option);
      }
    };

    filter.addEventListener("input", fill);
    filter.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeSelectorPicker();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        list.querySelector<HTMLButtonElement>("button")?.click();
      }
    });

    panel.append(filter, list);
    doc.body.appendChild(panel);
    const rect = anchorEl.getBoundingClientRect();
    panel.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 260))}px`;
    panel.style.top = `${Math.min(rect.bottom + 2, window.innerHeight - 240)}px`;
    // Dismiss on ANY pointer press outside the popup (and outside the button that opened it) — the
    // popup used to stay on screen forever once it had been opened. Capture phase, so a consumer that
    // stops the event cannot keep it alive.
    const onOutsidePointerDown = (event: Event): void => {
      const target = event.target as Node | null;
      if (target && (panel.contains(target) || anchorEl.contains(target))) {
        return;
      }
      closeSelectorPicker();
    };
    doc.addEventListener("pointerdown", onOutsidePointerDown, true);
    pickerPanel = panel;
    pickerTeardown = () => doc.removeEventListener("pointerdown", onOutsidePointerDown, true);
    fill();
    filter.focus();
  }

  /** Renders the rule grid from the current text. */
  const renderRules = (): void => {
    rulesBody.replaceChildren();
    const rules = parseCssRules(state.text).filter((rule) => rule.selector !== "" || rule.body !== "");

    if (rules.length === 0) {
      const emptyRow = el(doc, "tr");
      const emptyCell = el(doc, "td", "color:#6b778c;padding:6px 4px", "No rules yet — use “Add rule”.");
      emptyCell.colSpan = 3;
      emptyRow.appendChild(emptyCell);
      rulesBody.appendChild(emptyRow);
      return;
    }

    rules.forEach((rule, index) => {
      const row = el(doc, "tr");

      const selectorCell = el(doc, "td");
      const selectorWrap = el(doc, "div");
      selectorWrap.className = "codbi-csse-cell";
      const selectorInput = el(doc, "input");
      selectorInput.className = "codbi-csse-input codbi-csse-input--mono";
      selectorInput.value = rule.selector;
      selectorInput.setAttribute("aria-label", labels.selectorHeader);
      selectorInput.addEventListener("input", () => {
        const next = parseCssRules(state.text);
        if (next[index]) {
          next[index] = { ...next[index], selector: selectorInput.value };
        }
        // Keep the focus: typing in a cell must not rebuild the grid.
        writeRules(next, false);
      });
      selectorInput.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          commitAndApply();
        }
      });
      selectorWrap.appendChild(selectorInput);
      // Dropdown filling the (still free-text) selector. For a stylesheet it lists the form's own
      // classes; for a KEYFRAME step list (`0% { … }`) a CSS class is meaningless — the picker offers
      // the step percentages (`from`, `0%` … `100%`) instead.
      const keyframeRow = isKeyframeValue();
      const pickerBtn = mkButton(doc, "▾");
      pickerBtn.className = "codbi-csse-icon";
      pickerBtn.title = keyframeRow ? labels.pickKeyframeStep : labels.pickSelector;
      pickerBtn.setAttribute("aria-label", pickerBtn.title);
      pickerBtn.addEventListener("click", () => {
        openSelectorPicker(
          pickerBtn,
          (picked) => {
            selectorInput.value = picked;
            selectorInput.dispatchEvent(new Event("input"));
            selectorInput.focus();
          },
          keyframeRow ? KEYFRAME_STEP_CANDIDATES : undefined,
          keyframeRow ? labels.filterKeyframeSteps : undefined,
        );
      });
      selectorWrap.appendChild(pickerBtn);
      selectorCell.appendChild(selectorWrap);

      const bodyCell = el(doc, "td");
      const bodyWrap = el(doc, "div");
      bodyWrap.className = "codbi-csse-cell";
      const bodyInput = el(doc, "input");
      bodyInput.className = "codbi-csse-input codbi-csse-input--mono";
      bodyInput.value = rule.body;
      bodyInput.setAttribute("aria-label", labels.bodyHeader);
      bodyInput.addEventListener("input", () => {
        const next = parseCssRules(state.text);
        if (next[index]) {
          next[index] = { ...next[index], body: bodyInput.value };
        }
        writeRules(next, false);
      });

      // Swatch for the first color of this rule's declarations (opens the color picker).
      const bodyToken = firstColorToken(rule.body);
      if (bodyToken) {
        const bodySwatch = mkButton(doc, "");
        bodySwatch.className = "codbi-csse-swatch";
        const parsedBodyColor = parseColor(bodyToken.text);
        bodySwatch.style.background = parsedBodyColor ? swatchCss(parsedBodyColor) : "transparent";
        bodySwatch.title = `${labels.color}: ${bodyToken.text}`;
        bodySwatch.setAttribute("aria-label", labels.color);
        bodySwatch.addEventListener("click", () => {
          openColorPicker({
            document: doc,
            anchor: bodySwatch,
            value: bodyToken.text,
            onApply: (css) => {
              const nextBody = replaceColorToken(bodyInput.value, bodyToken, css);
              bodyInput.value = nextBody;
              const next = parseCssRules(state.text);
              if (next[index]) {
                next[index] = { ...next[index], body: nextBody };
              }
              writeRules(next);
            },
          });
        });
        bodyWrap.appendChild(bodySwatch);
      }

      bodyWrap.appendChild(bodyInput);
      bodyCell.appendChild(bodyWrap);

      const actionCell = el(doc, "td", "white-space:nowrap;width:88px");
      const up = mkButton(doc, "↑");
      up.className = "codbi-csse-icon";
      up.addEventListener("click", () => {
        const next = parseCssRules(state.text);
        if (index > 0) {
          [next[index - 1], next[index]] = [next[index], next[index - 1]];
          writeRules(next);
        }
      });
      const down = mkButton(doc, "↓");
      down.className = "codbi-csse-icon";
      down.addEventListener("click", () => {
        const next = parseCssRules(state.text);
        if (index < next.length - 1) {
          [next[index + 1], next[index]] = [next[index], next[index + 1]];
          writeRules(next);
        }
      });
      const remove = mkButton(doc, "✕");
      remove.className = "codbi-csse-icon codbi-csse-icon--del";
      remove.addEventListener("click", () => {
        const next = parseCssRules(state.text);
        next.splice(index, 1);
        writeRules(next);
      });
      actionCell.append(up, down, remove);

      row.append(selectorCell, bodyCell, actionCell);
      rulesBody.appendChild(row);
    });
  };

  const addRule = mkButton(doc, `＋ ${labels.addRule}`);
  addRule.className = "codbi-csse-add";
  addRule.addEventListener("click", () => {
    const rules = parseCssRules(state.text);
    rules.push({ selector: ".new-selector", body: "color: inherit;" });
    writeRules(rules);
  });

  rulesTable.appendChild(rulesBody);
  rulesView.append(rulesTable, addRule);
  // #endregion Rules view

  // #region Declarations view
  const declarationsView = el(doc, "div");
  const declarationsTable = el(doc, "table");
  declarationsTable.className = "codbi-csse-table";
  const declarationsBody = el(doc, "tbody");

  /** Writes the declaration list back into the shared text state. */
  const writeDeclarations = (declarations: ReadonlyArray<ICssDeclaration>, rerenderGrid = true): void => {
    commitText(joinDeclarations(declarations), rerenderGrid);
  };

  /** Renders the property/value grid. */
  const renderDeclarations = (): void => {
    declarationsBody.replaceChildren();
    const declarations = splitDeclarations(state.text);

    if (declarations.length === 0) {
      const emptyRow = el(doc, "tr");
      const emptyCell = el(doc, "td", "color:#6b778c;padding:6px 4px", "No declarations yet — use “Add declaration”.");
      emptyCell.colSpan = 4;
      emptyRow.appendChild(emptyCell);
      declarationsBody.appendChild(emptyRow);
      return;
    }

    declarations.forEach((declaration, index) => {
      const row = el(doc, "tr");

      const propertyCell = el(doc, "td", "width:38%");
      const propertyInput = el(doc, "input");
      propertyInput.className = "codbi-csse-input codbi-csse-input--mono";
      propertyInput.value = declaration.property;
      propertyInput.setAttribute("aria-label", labels.propertyHeader);
      if (!isKnownProperty(declaration.property)) {
        propertyInput.classList.add("codbi-csse-input--bad");
      }
      propertyInput.addEventListener("input", () => {
        const next = splitDeclarations(state.text);
        if (next[index]) {
          next[index] = { ...next[index], property: propertyInput.value };
        }
        // Keep the focus while typing.
        writeDeclarations(next, false);
      });
      // The property name stays free text, but a filterable picker of every known property makes it
      // discoverable — the same affordance the rule grid offers for selectors.
      const propertyWrap = el(doc, "div");
      propertyWrap.className = "codbi-csse-cell";
      propertyWrap.appendChild(propertyInput);
      const propertyPicker = mkButton(doc, "▾");
      propertyPicker.className = "codbi-csse-icon";
      propertyPicker.title = labels.pickProperty;
      propertyPicker.setAttribute("aria-label", labels.pickProperty);
      propertyPicker.addEventListener("click", () => {
        openSelectorPicker(
          propertyPicker,
          (picked) => {
            propertyInput.value = picked;
            propertyInput.dispatchEvent(new Event("input"));
            propertyInput.focus();
          },
          CSS_PROPERTY_CANDIDATES,
          labels.filterProperties,
        );
      });
      propertyWrap.appendChild(propertyPicker);
      propertyCell.appendChild(propertyWrap);

      const valueCell = el(doc, "td");
      const valueWrap = el(doc, "div");
      valueWrap.className = "codbi-csse-cell";

      // Color / gradient affordance for this declaration: a swatch that opens the color picker, or a
      // gradient chip that re-opens the gradient generator for the value.
      const colorToken = firstColorToken(declaration.value);
      if (colorToken) {
        const swatchBtn = mkButton(doc, "");
        swatchBtn.className = "codbi-csse-swatch";
        const parsedColor = parseColor(colorToken.text);
        swatchBtn.style.background = parsedColor ? swatchCss(parsedColor) : "transparent";
        swatchBtn.title = `${labels.color}: ${colorToken.text}`;
        swatchBtn.setAttribute("aria-label", labels.color);
        swatchBtn.addEventListener("click", () => {
          openColorPicker({
            document: doc,
            anchor: swatchBtn,
            value: colorToken.text,
            onApply: (css) => {
              valueInput.value = replaceColorToken(valueInput.value, colorToken, css);
              const next = splitDeclarations(state.text);
              if (next[index]) {
                next[index] = { ...next[index], value: valueInput.value };
              }
              writeDeclarations(next);
            },
          });
        });
        valueWrap.appendChild(swatchBtn);
      } else if (isGradientLike(declaration.value)) {
        const gradientChip = mkButton(doc, "▨");
        gradientChip.className = "codbi-csse-icon";
        gradientChip.title = labels.gradient;
        gradientChip.setAttribute("aria-label", labels.gradient);
        gradientChip.addEventListener("click", () => {
          openGradientBuilder({
            document: doc,
            anchor: gradientChip,
            value: declaration.value,
            onInsert: (css) => {
              valueInput.value = css;
              const next = splitDeclarations(state.text);
              if (next[index]) {
                next[index] = { ...next[index], value: css };
              }
              writeDeclarations(next);
            },
          });
        });
        valueWrap.appendChild(gradientChip);
      }

      const valueInput = el(doc, "input");
      valueInput.className = "codbi-csse-input codbi-csse-input--mono";
      valueInput.value = declaration.value;
      valueInput.setAttribute("aria-label", labels.valueHeader);
      valueInput.addEventListener("input", () => {
        const next = splitDeclarations(state.text);
        if (next[index]) {
          next[index] = { ...next[index], value: valueInput.value };
        }
        // Keep the focus while typing.
        writeDeclarations(next, false);
      });
      // Per-declaration EP slot: a value may be generated by an element placeholder.
      const epBtn = mkButton(doc, "ƒ");
      epBtn.className = "codbi-csse-icon";
      epBtn.title = "Element placeholder";
      epBtn.addEventListener("click", () => {
        openEpFor(valueInput, (applied) => {
          valueInput.value = applied;
          const next = splitDeclarations(state.text);
          if (next[index]) {
            next[index] = { ...next[index], value: applied };
          }
          writeDeclarations(next);
        });
      });
      valueWrap.append(valueInput, epBtn);
      valueCell.appendChild(valueWrap);

      const importantCell = el(doc, "td", "width:44px;text-align:center");
      const important = el(doc, "input");
      important.type = "checkbox";
      important.checked = declaration.important;
      important.title = "!important";
      important.addEventListener("change", () => {
        const next = splitDeclarations(state.text);
        if (next[index]) {
          next[index] = { ...next[index], important: important.checked };
        }
        writeDeclarations(next, false);
      });
      importantCell.appendChild(important);

      const actionCell = el(doc, "td", "width:44px;text-align:right");
      const remove = mkButton(doc, "✕");
      remove.className = "codbi-csse-icon codbi-csse-icon--del";
      remove.addEventListener("click", () => {
        const next = splitDeclarations(state.text);
        next.splice(index, 1);
        writeDeclarations(next);
      });
      actionCell.appendChild(remove);

      row.append(propertyCell, valueCell, importantCell, actionCell);
      declarationsBody.appendChild(row);
    });
  };

  const addDeclaration = mkButton(doc, `＋ ${labels.addDeclaration}`);
  addDeclaration.className = "codbi-csse-add";
  addDeclaration.addEventListener("click", () => {
    const declarations = splitDeclarations(state.text);
    declarations.push({ property: "color", value: "inherit", important: false });
    writeDeclarations(declarations);
  });

  declarationsTable.appendChild(declarationsBody);
  declarationsView.append(declarationsTable, addDeclaration);
  // #endregion Declarations view

  // #region Classes view
  const classesView = el(doc, "div");
  const chips = el(doc, "div");
  chips.className = "codbi-csse-chips";
  const classInput = el(doc, "input");
  classInput.className = "codbi-csse-input codbi-csse-input--mono";
  classInput.placeholder = labels.classPlaceholder;

  /** Writes the class list back into the shared text state. */
  const writeClasses = (list: ReadonlyArray<string>): void => {
    state.classes = parseClassList(list.join(" "));
    commitText(state.classes.join(" "));
  };

  const renderClasses = (): void => {
    chips.replaceChildren();
    for (const name of state.classes) {
      const chip = el(doc, "span");
      chip.className = "codbi-csse-chip";
      chip.appendChild(el(doc, "span", "", name));
      const remove = mkButton(doc, "✕");
      remove.title = `Remove ${name}`;
      remove.addEventListener("click", () => {
        writeClasses(state.classes.filter((entry) => entry !== name));
      });
      chip.appendChild(remove);
      chips.appendChild(chip);
    }
  };

  classInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      const value = classInput.value.trim().replace(/^\./, "");
      if (value !== "") {
        writeClasses([...state.classes, value]);
        classInput.value = "";
      }
    }
  });

  const addClassBtn = mkButton(doc, `＋ ${labels.addClass}`);
  addClassBtn.className = "codbi-csse-add";
  addClassBtn.addEventListener("click", () => {
    const value = classInput.value.trim().replace(/^\./, "");
    writeClasses(value === "" ? state.classes : [...state.classes, value]);
    classInput.value = "";
  });

  const knownChipRow = el(doc, "div");
  knownChipRow.className = "codbi-csse-chips";
  for (const className of options.knownClasses ?? []) {
    if (state.classes.includes(className)) {
      continue;
    }
    const pick = mkButton(doc, className);
    pick.className = "codbi-csse-btn";
    pick.addEventListener("click", () => {
      writeClasses([...state.classes, className]);
    });
    knownChipRow.appendChild(pick);
  }

  classesView.append(
    chips,
    el(doc, "div", "height:6px"),
    classInput,
    el(doc, "div", "height:6px"),
    addClassBtn,
    el(doc, "div", "height:10px"),
    el(doc, "div", "color:#6b778c;font-size:11px", "Classes used in the form:"),
    knownChipRow,
  );
  // #endregion Classes view

  // #region Selector view
  const selectorView = el(doc, "div");
  const selectorInput = el(doc, "input");
  selectorInput.className = "codbi-csse-input codbi-csse-input--mono";
  selectorInput.placeholder = labels.selectorPlaceholder;
  const matchCount = el(doc, "div", "margin-top:6px;color:#6b778c;font-size:11px", "");
  const pickBtn = mkButton(doc, labels.pick);
  pickBtn.className = "codbi-csse-btn";
  const selectorList = el(doc, "div", "margin-top:8px;display:flex;flex-direction:column;gap:4px");
  selectorList.className = "codbi-csse-chips";

  selectorInput.addEventListener("input", () => {
    commitText(selectorInput.value);
  });

  /** Renders the match counter (no automatic element creation — read only). */
  const renderSelectorMatches = (): void => {
    const selector = state.text.trim();
    if (selector === "") {
      matchCount.textContent = "";
      return;
    }
    const error = validateSelector(selector);
    if (error) {
      matchCount.textContent = `! ${error}`;
      matchCount.style.color = "#de350b";
      return;
    }
    const count = doc.querySelectorAll(selector).length;
    matchCount.textContent = `${count} ${labels.matches}`;
    matchCount.style.color = count === 0 ? "#ff991f" : "#6b778c";
  };

  // Click-to-pick: arms a one-shot capture listener that derives a selector from the clicked element.
  pickBtn.addEventListener("click", () => {
    const listener = (event: Event): void => {
      const target = event.target as Element | null;
      if (!target || popup.contains(target)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      doc.removeEventListener("click", listener, true);
      const tag = target.tagName.toLowerCase();
      const id = target.id ? `#${target.id}` : "";
      const classes = Array.from(target.classList)
        .filter((name) => name.trim() !== "")
        .map((name) => `.${name}`)
        .join("");
      const derived = id !== "" ? `${tag}${id}` : `${tag}${classes}`;
      selectorInput.value = derived;
      commitText(derived);
    };
    doc.addEventListener("click", listener, true);
  });

  // Class suggestions collected from the form (click to use as a selector).
  for (const className of options.knownClasses ?? []) {
    const pick = mkButton(doc, `.${className}`);
    pick.className = "codbi-csse-btn";
    pick.addEventListener("click", () => {
      selectorInput.value = `.${className}`;
      commitText(selectorInput.value);
    });
    selectorList.appendChild(pick);
  }

  selectorView.append(selectorInput, matchCount, pickBtn, selectorList);
  // #endregion Selector view

  // #region Views registry
  const views: Record<TView, HTMLElement> = {
    text: editorBox,
    rules: rulesView,
    declarations: declarationsView,
    classes: classesView,
    selector: selectorView,
  };

  /**
   * @returns Whether the current value is a KEYFRAME STEP list rather than a flat declaration block.
   *
   * `HTML.Panel`'s `CSSAnimFadeINPanel` is such a value (`0% { … } 30% { … }`); the runtime wraps it in
   * `@keyframes … { <value> }`. It cannot be shown in the declaration grid (its `0% { … }` preludes are
   * selectors, not properties), so only the text view is offered.
   */
  const isKeyframeValue = (): boolean => kind === "declarations" && isKeyframeSteps(state.text);

  const availableViews = (): TView[] => {
    // The raw text view is always first: it shows the complete value immediately, which matches the
    // CSV editor's behaviour (the structured grid is one click away).
    if (kind === "stylesheet") {
      return ["text", "rules"];
    }
    if (kind === "declarations") {
      // A flat declaration list is best edited in its grid; a KEYFRAME list has no declaration grid
      // (its `0% { … }` preludes are selectors), so its step grid — the Rules view — is the default.
      return isKeyframeValue() ? ["rules", "text"] : ["declarations", "text"];
    }
    return [kind];
  };

  const renderTabs = (): void => {
    tabStrip.replaceChildren();
    const all = availableViews();
    if (!all.includes(state.view)) {
      state.view = all[0];
    }
    for (const view of all) {
      const label =
        view === "rules"
          ? labels.rulesTab
          : view === "text"
            ? labels.textTab
            : view === "declarations"
              ? labels.declarationsTab
              : view === "classes"
                ? labels.classesTab
                : labels.selectorTab;
      const tab = mkButton(doc, label);
      tab.className = "codbi-csse-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(state.view === view));
      tab.addEventListener("click", () => {
        state.view = view;
        renderAll();
      });
      tabStrip.appendChild(tab);
    }
  };

  /** Shows the active view and re-renders it from the shared state. */
  const renderView = (): void => {
    main.replaceChildren();
    for (const [name, node] of Object.entries(views)) {
      node.style.display = name === state.view ? "" : "none";
    }
    main.appendChild(views[state.view]);

    if (state.view === "rules") {
      renderRules();
    } else if (state.view === "declarations") {
      renderDeclarations();
    } else if (state.view === "classes") {
      renderClasses();
    } else if (state.view === "selector") {
      selectorInput.value = state.text;
      renderSelectorMatches();
    } else {
      if (textarea.value !== state.text) {
        textarea.value = state.text;
      }
      syncGutter();
    }
  };
  // #endregion Views registry

  // #region Preview
  const previewBar = el(doc, "div", "display:flex;align-items:center;gap:6px");
  const previewLabel = el(doc, "span", "color:#6b778c;font-size:11px", labels.preview);
  // The preview is ONLY updated on request: editing a property letter by letter must not re-apply a
  // half-typed (invalid) declaration. The button turns darkorange while changes are pending.
  const updatePreviewBtn = mkButton(doc, "⟳");
  updatePreviewBtn.className = "codbi-csse-updatebtn";
  previewBar.append(previewLabel, updatePreviewBtn);
  const previewFrame = el(doc, "iframe");
  previewFrame.className = "codbi-csse-preview";
  previewFrame.title = labels.preview;
  // No `sandbox`: the platform preview page is trusted and its runtime must run unfettered (same as the
  // element preview switch, which loads the very same URL).
  // The preview renders the REAL form from the canvas with the edited CSS applied — the CodBi chrome
  // (markers, badge tables, this popup's own styles) is stripped first, and every element matched by a
  // selector is outlined so the author sees WHAT the rules hit.
  const highlightToggle = el(doc, "input");
  highlightToggle.type = "checkbox";
  highlightToggle.checked = true;
  const highlightLabel = el(doc, "label", "display:inline-flex;align-items:center;gap:4px;color:#6b778c");
  highlightLabel.append(highlightToggle, el(doc, "span", "", labels.highlightMatches));
  side.append(previewBar, previewFrame, highlightLabel);

  /**
   * Every document that may hold the rendered form. The form is normally rendered inside the
   * designer's CANVAS IFRAME (the popup itself lives in the designer window), so the iframes are
   * probed explicitly — the anchor's own document and this one come first.
   */
  const formDocuments = (): Document[] => {
    const candidates: Array<Document | null | undefined> = [options.anchor?.ownerDocument, doc];
    for (const frame of Array.from(doc.querySelectorAll("iframe"))) {
      try {
        candidates.push(frame.contentDocument);
      } catch {
        /* cross-origin frame — not readable */
      }
    }
    const list: Document[] = [];
    for (const candidate of candidates) {
      if (candidate && !list.includes(candidate)) {
        list.push(candidate);
      }
    }
    return list;
  };

  /**
   * @returns the rendered form root, or null when it cannot be reached. The FORMCYCLE form wrappers
   * are probed across ALL documents before any bare `<form>` (a designer property panel is a `<form>`
   * too, and must never win over the real form).
   */
  const formRoot = (): HTMLElement | null => {
    const docs = formDocuments();
    for (const selector of [".xform", "form.xm-form", "form"]) {
      for (const candidate of docs) {
        const root = candidate.querySelector<HTMLElement>(selector);
        if (root) {
          return root;
        }
      }
    }
    return null;
  };

  /** The stylesheet that outlines the elements a selector matches. */
  const HIGHLIGHT_CSS = "[data-csse-hit]{outline:2px dashed rgba(255,140,0,.95) !important;outline-offset:2px}";

  /** Attribute that marks the nodes a `declarations` parameter styles (the injected rule's selector). */
  const DECLARATION_TARGET_ATTR = "data-csse-target";

  /** Attribute that marks the element the preview is focused on (also used to scroll it into view). */
  const FOCUS_ATTR = "data-csse-focus";

  /** The panel chrome a `HTML.Panel` CSS parameter styles at runtime. */
  const PANEL_HEADER_SELECTOR = ".CodBi_HTML_Panel_Header, .CodBi_HTML_Panel_Folded";

  /**
   * The pseudo-class/-element a `declarations` parameter is meant for, derived from its name.
   *
   * `HTML.Panel` does not write all of its CSS parameters onto the header itself — see
   * `html.panel.ts`: the "after header" block becomes `.CodBi_HTML_Panel_Header::after { content: … }`,
   * "before header" becomes `::before`, the hover style becomes `:hover` and the active style
   * `:active`. Applied to the plain element such a block can never show anything, which is why those
   * parameters used to produce an empty-looking preview.
   */
  const declarationSuffix = ((): string => {
    const name = String(options.parameterName ?? "").toLowerCase();
    if (name === "") {
      return "";
    }
    if (name.includes("beforeheader")) {
      return "::before";
    }
    if (name.includes("afterheader")) {
      return "::after";
    }
    if (name.includes("foldedhover") || name.includes("headerhover")) {
      return ":hover";
    }
    if (name.includes("headeractive")) {
      return ":active";
    }
    return "";
  })();

  /** Whether {@link declarationSuffix} targets a pseudo ELEMENT (which needs a `content` to render). */
  const suffixIsPseudoElement = declarationSuffix.startsWith("::");

  /**
   * @param text - The sanitized declaration block.
   * @returns The block to inject for {@link declarationSuffix}.
   *
   * A pseudo ELEMENT renders only with a `content` value. The runtime supplies it from its own
   * `CSS…Content` parameter, which the editor does not edit here — so an empty one is added unless the
   * block sets its own, otherwise the author could never see the styled pseudo.
   */
  const declarationBody = (text: string): string => {
    if (!suffixIsPseudoElement) {
      return text;
    }
    const setsContent = splitDeclarations(text).some(
      (declaration) => declaration.property.trim().toLowerCase() === "content",
    );
    return setsContent ? text : `content:"";${text}`;
  };

  /**
   * @param target - The selector the declarations apply to.
   * @param text   - The sanitized declarations (or keyframe-step list).
   * @returns The CSS that applies them.
   *
   * A KEYFRAME STEP list (`0% { … } 30% { … }`) is not a declaration block: the runtime wraps it in
   * `@keyframes … { <value> }` and animates the panel with it (see `html.panel.ts`). Injecting the bare
   * steps would be invalid CSS and silently dropped, so the same wrapper is emitted here — with an
   * `animation` on the target so the author actually sees the effect.
   */
  const declarationsRuleCss = (target: string, text: string): string =>
    isKeyframeValue()
      ? `@keyframes codbi-csse-preview{${text}}${target}{animation:codbi-csse-preview 1.2s ease-in-out forwards}`
      : `${target}${declarationSuffix}{${declarationBody(text)}}`;

  /** The selectors the current value defines (used by both preview flavours). */
  const currentSelectors = (): string[] => {
    if (state.kind === "stylesheet") {
      return parseCssRules(state.text)
        .map((rule) => rule.selector.trim())
        .filter((selector) => selector !== "" && !selector.startsWith("@"));
    }
    if (state.kind === "selector") {
      return state.text
        .split(",")
        .map((selector) => selector.trim())
        .filter((selector) => selector !== "");
    }
    return [];
  };

  // #region Live preview (the SAME page the element preview switch loads)
  /** Id of the style element injected into the live preview document. */
  const LIVE_STYLE_ID = "codbi-csse-live";

  /** @returns the live preview document (same-origin), or null while it is not available. */
  const livePreviewDoc = (): Document | null => {
    try {
      return previewFrame.contentDocument ?? null;
    } catch {
      return null;
    }
  };

  /**
   * The live preview document tree: the preview frame's own document PLUS every nested same-origin
   * frame. The FORMCYCLE preview page may render the form inside a nested iframe — styling only the
   * top document then had no visible effect at all.
   */
  const livePreviewDocs = (): Document[] => {
    const collected: Document[] = [];
    const visit = (candidate: Document | null): void => {
      if (!candidate || collected.includes(candidate)) {
        return;
      }
      collected.push(candidate);
      for (const frame of Array.from(candidate.querySelectorAll("iframe"))) {
        try {
          visit(frame.contentDocument);
        } catch {
          /* cross-origin frame — not readable */
        }
      }
    };
    visit(livePreviewDoc());
    return collected;
  };

  /** @returns the element being styled inside `target`, located by its designer id. */
  const liveTargetElement = (target: Document): HTMLElement | null => {
    const id = options.previewElementId ?? "";
    if (id === "") {
      return null;
    }
    return target.getElementById(id) ?? target.querySelector<HTMLElement>(`[xi="${id}"], [data-xi="${id}"]`);
  };

  /** @returns the document + element pair that actually holds the styled element, or null. */
  const findLiveTarget = (): { doc: Document; element: HTMLElement } | null => {
    for (const candidate of livePreviewDocs()) {
      const element = liveTargetElement(candidate);
      if (element) {
        return { doc: candidate, element };
      }
    }
    return null;
  };

  /**
   * @param element - A panel element.
   * @returns The panel's OWN header, or null.
   *
   * `HTML.Panel` documents that its header is "nested at most two levels within the tagged element",
   * and in practice it is wrapped once (`<div class="cHeader">`): the tagged element is the panel
   * ROOT and the header is its first child or first grandchild. Only those two levels are inspected —
   * a plain `querySelector` would also return the header of a panel CONTAINED in this one, and styling
   * that header painted this panel's border, background and radius onto the container of an unrelated
   * control living inside it.
   */
  const ownPanelHeader = (element: HTMLElement): HTMLElement | null => {
    if (element.matches(PANEL_HEADER_SELECTOR)) {
      return element;
    }
    // `HTML.Panel` keeps its header ON the panel element (`panel.CodBi_HTML_Panel_Header`) — the
    // authoritative pointer, and the only one that still holds while the panel is FOLDED (the header
    // is then moved out of the panel and lives next to it). Styling the panel WRAPPER instead is what
    // hid the panel's content once it was unfolded (its `height`/`overflow` applied to the wrapper).
    const declared = (element as unknown as { CodBi_HTML_Panel_Header?: HTMLElement }).CodBi_HTML_Panel_Header;
    if (declared?.isConnected) {
      return declared;
    }
    for (const child of Array.from(element.children)) {
      const direct = child as HTMLElement;
      if (direct.matches?.(PANEL_HEADER_SELECTOR)) {
        return direct;
      }
      for (const grandChild of Array.from(direct.children)) {
        if ((grandChild as HTMLElement).matches?.(PANEL_HEADER_SELECTOR)) {
          return grandChild as HTMLElement;
        }
      }
    }
    return null;
  };

  /**
   * @param element - The element the editor was invoked for.
   * @returns The single node a `declarations` parameter styles for it.
   *
   * An `HTML.Panel` CSS parameter styles the panel HEADER at runtime, so the panel's own header wins
   * whenever there is one. While the panel is FOLDED its header is moved out of the panel (and tagged
   * `CodBi_HTML_Panel_Folded`), which is the second candidate. Everything else styles the element
   * itself — never the panel wrapper, whose borders/background would show as a second panel behind
   * the header as soon as the panel is unfolded.
   */
  const declarationTargets = (element: HTMLElement): HTMLElement[] => {
    const own = ownPanelHeader(element);
    if (own) {
      return [own];
    }
    const parent = element.parentElement;
    if (parent) {
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== element && (sibling as HTMLElement).matches?.(".CodBi_HTML_Panel_Folded")) {
          return [sibling as HTMLElement];
        }
      }
    }
    return [element];
  };

  /** How many times the clip was attempted for the current preview load. */
  let clipAttempts = 0;

  /**
   * Re-clips the preview to the styled element (which also hides the platform preview menu).
   *
   * The preview page renders the form ASYNCHRONOUSLY — the element simply is not there yet when the
   * iframe fires `load`, so a single attempt silently left the WHOLE page visible. This retries (the
   * marker preview does the same via `scheduleClip`) until the element is found.
   *
   * @param reset - Restarts the attempt counter (a fresh preview load).
   */
  const clipLivePreview = (reset = false): void => {
    if (!options.previewClip || !options.previewElementId) {
      return;
    }
    if (reset) {
      clipAttempts = 0;
    }
    try {
      options.previewClip(previewFrame, options.previewElementId);
    } catch {
      /* clipping is best-effort */
    }
    // Keep re-clipping for a while even after a SUCCESS: the preview page initialises — and may
    // re-render its DOM — asynchronously, and a re-render brings the hidden siblings back. The last
    // attempt wins, so the element stays isolated once the form has settled.
    clipAttempts += 1;
    if (clipAttempts < 40) {
      window.setTimeout(() => {
        // Re-inject as well: the preview page initialises (and re-renders) asynchronously and would
        // otherwise drop the injected CSS again — the last pass wins.
        injectLiveCss();
        clipLivePreview(false);
      }, 250);
    }
  };

  /** Injects the edited CSS into the live preview and tags every element the selectors match. */
  const injectLiveCss = (): void => {
    const docs = livePreviewDocs();
    if (docs.length === 0) {
      // The preview document is not ready — keep trying to isolate the element.
      previewLabel.textContent = `${labels.preview} · ${labels.previewNotReachable}`;
      clipLivePreview();
      return;
    }
    const sanitized = sanitizeCssForPreview(state.text);
    const selectors = currentSelectors();

    // A `declarations` parameter is a bare declaration block without a selector, so the preview needs
    // one. It is applied through the injected stylesheet — exactly like at the beginning of this
    // editor — and NOT inline: an inline write also painted the parameter's chrome onto whatever
    // container sat inside the styled element. The nodes the parameter really styles are marked, and
    // the rule targets exactly those.
    let ruleCss = "";
    if (state.kind === "stylesheet") {
      ruleCss = sanitized;
    } else if (state.kind === "declarations") {
      const hit = findLiveTarget();
      if (!hit) {
        // Tell the author instead of silently doing nothing.
        previewLabel.textContent = `${labels.preview} · ${labels.previewNoTarget}`;
      } else {
        // The runtime writes this very parameter INLINE, which is what once made a stale value linger
        // in the preview. Only those properties are dropped from the inline style so the injected
        // rule wins — no `!important`, so the real cascade stays intact.
        // A keyframe list has no inline counterpart to clear — every "property" it would yield is a
        // step prelude, so the inline cleanup is skipped for it.
        const properties = isKeyframeValue()
          ? []
          : splitDeclarations(sanitized)
              .map((declaration) => declaration.property)
              .filter((property) => property !== "");
        for (const node of declarationTargets(hit.element)) {
          node.setAttribute(DECLARATION_TARGET_ATTR, "");
          for (const property of properties) {
            node.style.removeProperty(property);
          }
        }
        ruleCss = declarationsRuleCss(`[${DECLARATION_TARGET_ATTR}]`, sanitized);
      }
    }

    let hits = 0;
    for (const candidate of docs) {
      if (!candidate.head) {
        continue;
      }
      let liveStyle = candidate.getElementById(LIVE_STYLE_ID) as HTMLStyleElement | null;
      if (!liveStyle) {
        liveStyle = candidate.createElement("style");
        liveStyle.id = LIVE_STYLE_ID;
        candidate.head.appendChild(liveStyle);
      }
      // Everything is a stylesheet rule — declarations go through their marked selector — and no
      // `!important` override is used, so the preview shows the real cascade.
      liveStyle.textContent = `${ruleCss}\n.codbi-csse-hit{outline:2px dashed rgba(255,140,0,.95) !important;outline-offset:2px}`;

      for (const node of Array.from(candidate.querySelectorAll(".codbi-csse-hit"))) {
        node.classList.remove("codbi-csse-hit");
      }
      if (!highlightToggle.checked) {
        continue;
      }
      for (const selector of selectors) {
        try {
          for (const match of Array.from(candidate.querySelectorAll(selector))) {
            match.classList.add("codbi-csse-hit");
            hits += 1;
          }
        } catch {
          /* invalid selectors are reported by the issues panel */
        }
      }
    }
    previewLabel.textContent = `${labels.preview} · ${hits} ${labels.matches}`;
  };

  /** Full update of the live preview: inject the CSS, then re-clip the element. */
  const applyLiveCss = (): void => {
    injectLiveCss();
    // The element may have changed size with the CSS (padding, borders, …) — re-clip so the preview
    // keeps showing exactly that element and the platform's preview menu stays hidden.
    clipLivePreview();
  };

  /** Marks (and scrolls to) the styled element once the live preview has loaded. */
  const focusLiveTarget = (): void => {
    const hit = findLiveTarget();
    if (!hit) {
      return;
    }
    // A dedicated attribute — `data-csse-target` belongs to the declarations rule above.
    hit.element.setAttribute(FOCUS_ATTR, "");
    try {
      hit.element.scrollIntoView({ block: "center" });
    } catch {
      /* not supported */
    }
  };
  // #endregion Live preview

  /** Monotonic counter so two loads in the same millisecond still get distinct URLs. */
  let previewLoads = 0;

  /** @returns the preview URL with a cache-buster so every load fetches the CURRENT draft. */
  const livePreviewSrc = (): string => {
    previewLoads += 1;
    const base = options.previewSrc ?? "";
    return `${base}${base.includes("?") ? "&" : "?"}_cbcss=${Date.now()}-${previewLoads}`;
  };

  /**
   * Reloads the platform preview. The `load` handler re-clips the element and re-applies the edited
   * CSS, so a reload is the most reliable way to show the current value (it also picks up everything
   * the runtime re-applies to the freshly rendered form).
   */
  const reloadLivePreview = (): void => {
    previewLabel.textContent = labels.preview;
    previewFrame.src = livePreviewSrc();
  };

  if (options.previewSrc) {
    previewFrame.addEventListener("load", () => {
      focusLiveTarget();
      // Clip FIRST (hides the platform menu and every other element), then inject the CSS so the clip
      // is measured against the un-styled layout once and re-fitted by the CSS pass below.
      clipLivePreview(true);
      applyLiveCss();
    });
    reloadLivePreview();
  }

  /**
   * Clones the rendered form and tags every element the given selectors match.
   *
   * @param selectors - The selectors to tag.
   * @param markRoot  - Marks the cloned root with `data-csse-target` (a `declarations` parameter styles
   *                    the root: that is the element the editor was invoked for).
   * @returns The preview body plus the number of tagged elements, or null when no form is reachable.
   */
  const buildFormPreview = (
    selectors: ReadonlyArray<string>,
    markRoot = false,
  ): { html: string; hits: number } | null => {
    const root = options.previewRoot ?? formRoot();
    if (!root) {
      return null;
    }
    if (root.querySelectorAll("*").length > 4000) {
      // Too large to serialise into an iframe without freezing the designer — use the sample instead.
      return null;
    }
    const clone = root.cloneNode(true) as HTMLElement;
    // Strip EVERY CodBi designer widget (lowercase `codbi-…` classes — the form-side classes are
    // `CodBi_…` and must stay) so the preview shows the form element only, never our badges/overlays.
    const chrome = clone.querySelectorAll(
      '[class*="codbi-"], .codbi-csvg-overlay, .codbi-func-table, script, iframe, noscript, style[data-codbi-csse]',
    );
    for (const node of Array.from(chrome)) {
      node.remove();
    }
    if (markRoot) {
      clone.setAttribute(DECLARATION_TARGET_ATTR, "");
    }
    let hits = 0;
    for (const selector of selectors) {
      try {
        for (const match of Array.from(clone.querySelectorAll(selector))) {
          match.setAttribute("data-csse-hit", "");
          hits += 1;
        }
      } catch {
        /* invalid selectors are reported by the issues panel */
      }
    }
    return { html: clone.outerHTML, hits };
  };

  /** The sample markup rendered inside the preview iframe. */
  const SAMPLE_BODY = `<div class="sample"><div class="sample-header">Panel header</div><p class="sample-text">Text with a <a href="#">link</a> and <strong>bold</strong>.</p><input class="sample-input" placeholder="Input" /><button class="sample-button">Button</button><table class="sample-table"><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table></div>`;

  /** The preview document base stylesheet (only to make the sample readable). */
  const SAMPLE_BASE =
    "body{margin:0;padding:10px;font:13px system-ui,sans-serif;color:#172b4d}.sample-header{padding:6px;border:1px solid #ccc;border-radius:4px}.sample-input,.sample-button{margin:6px 0;padding:4px 8px}.sample-table{width:100%;border-collapse:collapse}.sample-table th,.sample-table td{border:1px solid #ddd;padding:3px 6px}";

  let previewTimer: number | undefined;

  /** Renders the preview document for the current text/kind. */
  const renderPreview = (): void => {
    if (options.previewSrc) {
      // The live platform preview is ALREADY the rendered form: only re-inject the CSS (no reload).
      applyLiveCss();
      return;
    }
    if (state.kind === "classes") {
      previewFrame.srcdoc = `<!doctype html><html><head><style>${SAMPLE_BASE}</style></head><body><p class="sample-text">Nothing to preview for a class list.</p></body></html>`;
      previewLabel.textContent = labels.preview;
      return;
    }

    const selectors =
      state.kind === "stylesheet"
        ? parseCssRules(state.text)
            .map((rule) => rule.selector.trim())
            .filter((selector) => selector !== "" && !selector.startsWith("@"))
        : state.kind === "selector"
          ? state.text.split(",").map((selector) => selector.trim())
          : [];

    const isDeclarations = state.kind === "declarations";
    const form = buildFormPreview(selectors, isDeclarations);
    const css =
      state.kind === "stylesheet"
        ? sanitizeCssForPreview(state.text)
        : isDeclarations
          ? // Declarations style the ELEMENT the editor was invoked for — the cloned root of the form
            // preview when there is one (the sample only stands in when no form is reachable). Before,
            // they always went to the sample's `.sample` box, which does not exist in a real form: the
            // preview then showed nothing at all for such a parameter.
            declarationsRuleCss(form ? `[${DECLARATION_TARGET_ATTR}]` : ".sample", sanitizeCssForPreview(state.text))
          : "";
    const highlight = form && highlightToggle.checked ? HIGHLIGHT_CSS : "";

    previewFrame.srcdoc = `<!doctype html><html><head><style>${SAMPLE_BASE}</style><style>${highlight}</style><style>${css}</style></head><body>${form?.html ?? SAMPLE_BODY}</body></html>`;
    previewLabel.textContent = form ? `${labels.preview} · ${form.hits} ${labels.matches}` : labels.preview;
  };

  /** Whether the edited CSS differs from what the preview currently shows. */
  let previewDirty = false;

  /** Reflects the pending-changes state on the Update button. */
  const syncUpdateButton = (): void => {
    updatePreviewBtn.classList.toggle("codbi-csse-updatebtn--dirty", previewDirty);
    updatePreviewBtn.title = previewDirty ? labels.updatePreviewDirty : labels.updatePreview;
    updatePreviewBtn.setAttribute("aria-label", labels.updatePreview);
  };

  /**
   * Marks the preview as stale — WITHOUT touching it. Editing a declaration letter by letter must not
   * re-apply a half-typed (invalid) rule: the author decides when the preview updates.
   */
  const markPreviewDirty = (): void => {
    previewDirty = true;
    syncUpdateButton();
  };

  /** Re-fits the preview to the current layout only — the applied CSS is left untouched. */
  const refitPreview = (): void => {
    if (options.previewSrc) {
      clipLivePreview(true);
    }
  };

  /** Applies the edited CSS to the preview: ONLY on the Update button (and once when opening). */
  const applyPreviewCss = (): void => {
    previewDirty = false;
    syncUpdateButton();
    if (options.previewSrc) {
      // Reload the preview on demand: the load handler re-clips and re-applies the CSS to the freshly
      // rendered form, so what you see is always built from the current value.
      reloadLivePreview();
    } else {
      renderPreview();
    }
    // Visible confirmation: the button briefly shows a check mark.
    updatePreviewBtn.textContent = "✓";
    window.setTimeout(() => {
      updatePreviewBtn.textContent = "⟳";
    }, 800);
  };

  updatePreviewBtn.addEventListener("click", applyPreviewCss);
  highlightToggle.addEventListener("change", applyPreviewCss);
  syncUpdateButton();
  // #endregion Preview

  // #region Issues panel
  const issuesLabel = el(doc, "div", "color:#6b778c;font-size:11px", labels.issues);
  const issuesList = el(doc, "div");
  issuesList.className = "codbi-csse-issues";
  side.append(issuesLabel, issuesList);

  /** Renders the diagnostics as clickable rows. */
  const renderIssues = (): void => {
    issuesList.replaceChildren();
    if (issues.length === 0) {
      issuesList.appendChild(el(doc, "div", "color:#6b778c;font-size:11px", labels.noIssues));
      return;
    }
    for (const issue of issues) {
      const row = el(doc, "button");
      row.type = "button";
      row.className = `codbi-csse-issue codbi-csse-issue--${issue.severity}`;
      const icon = issue.severity === "error" ? "×" : issue.severity === "warning" ? "!" : "ⓘ";
      row.appendChild(el(doc, "span", "flex:0 0 auto", icon));
      const textCell = el(doc, "span", "", issue.line > 0 ? `${issue.message} (line ${issue.line})` : issue.message);
      if (issue.hint) {
        textCell.title = issue.hint;
      }
      row.appendChild(textCell);
      row.addEventListener("click", () => {
        if (issue.line <= 0) {
          return;
        }
        if (state.kind === "stylesheet" || state.kind === "declarations") {
          state.view = "text";
          renderAll();
          gotoLine(issue.line);
        } else if (state.kind === "classes") {
          classInput.focus();
        } else {
          selectorInput.focus();
        }
      });
      issuesList.appendChild(row);
    }
  };
  // #endregion Issues panel

  // #region Toolbar
  const summaryText = (): string => cssValueSummary(encodePlainValue(), spec);

  /** @returns the value as it would be stored right now (used for summaries/tooltips). */
  function encodePlainValue(): string {
    if (state.kind === "classes") {
      return encodeCssValue(state.classes.join(" "), state.kind);
    }
    return encodeCssValue(state.text, state.kind, state.kind === "stylesheet" && !state.dialect);
  }

  const formatBtn = mkButton(doc, labels.format);
  formatBtn.className = "codbi-csse-btn";
  formatBtn.addEventListener("click", () => {
    commitText(formatCss(state.text, kind));
  });

  const minifyBtn = mkButton(doc, labels.minify);
  minifyBtn.className = "codbi-csse-btn";
  minifyBtn.addEventListener("click", () => {
    commitText(minifyCss(state.text));
  });

  const copyBtn = mkButton(doc, labels.copy);
  copyBtn.className = "codbi-csse-btn";
  copyBtn.addEventListener("click", () => {
    try {
      void navigator.clipboard?.writeText(state.text);
    } catch {
      /* clipboard unavailable */
    }
  });

  const exportBtn = mkButton(doc, labels.export);
  exportBtn.className = "codbi-csse-btn";
  exportBtn.addEventListener("click", () => {
    try {
      const blob = new Blob([state.text], { type: "text/css" });
      const url = URL.createObjectURL(blob);
      const link = el(doc, "a");
      link.href = url;
      link.download = "codbi-parameter.css";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      /* download unsupported */
    }
  });

  const importBtn = mkButton(doc, labels.import);
  importBtn.className = "codbi-csse-btn";
  const fileInput = el(doc, "input");
  fileInput.type = "file";
  fileInput.accept = ".css,text/css";
  fileInput.style.display = "none";
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) {
      return;
    }
    void file
      .text()
      .then((content) => {
        commitText(kind === "stylesheet" ? dialectToBraces(content) : content);
      })
      .catch(() => {
        /* unreadable file */
      });
  });
  importBtn.addEventListener("click", () => {
    fileInput.click();
  });

  /** Inserts text at the caret of the text view (switching to that view first when necessary). */
  const insertAtCaret = (css: string): void => {
    if (state.view !== "text" && (state.kind === "stylesheet" || state.kind === "declarations")) {
      state.view = "text";
      renderAll();
    }
    const start = textarea.selectionStart ?? state.text.length;
    const end = textarea.selectionEnd ?? start;
    commitText(`${state.text.slice(0, start)}${css}${state.text.slice(end)}`);
    textarea.focus();
    textarea.setSelectionRange(start + css.length, start + css.length);
  };

  const dialectLabel = el(doc, "label", "display:inline-flex;align-items:center;gap:4px;color:#6b778c");
  const dialectCheck = el(doc, "input");
  dialectCheck.type = "checkbox";
  dialectCheck.checked = state.dialect;
  dialectCheck.addEventListener("change", () => {
    state.dialect = dialectCheck.checked;
    dialectLabel.title = state.dialect ? labels.dialectOn : labels.dialectOff;
    refreshSummary();
  });
  dialectLabel.title = state.dialect ? labels.dialectOn : labels.dialectOff;
  dialectLabel.append(dialectCheck, el(doc, "span", "", "⟨…⟩"));

  // Quick fix (A4): drops every declaration the runtime sanitizer would neutralize anyway.
  const fixBlockedBtn = mkButton(doc, labels.fixBlocked);
  fixBlockedBtn.className = "codbi-csse-btn";
  fixBlockedBtn.title = "Removes every declaration the runtime sanitizer would neutralize.";
  /** @returns whether a declaration contains a pattern `sanitizeCss` strips. */
  const isBlockedDeclaration = (declaration: ICssDeclaration): boolean => {
    const text = `${declaration.property}: ${declaration.value}`;
    return (
      /url\s*\(\s*https?:\/\//i.test(text) ||
      /javascript\s*:/i.test(text) ||
      /expression\s*\(/i.test(text) ||
      /-moz-binding\s*:/i.test(text) ||
      /behavior\s*:/i.test(text)
    );
  };
  fixBlockedBtn.addEventListener("click", () => {
    if (state.kind === "stylesheet") {
      const rules = parseCssRules(state.text)
        .map((rule) => ({
          selector: rule.selector,
          body: joinDeclarations(
            splitDeclarations(rule.body).filter((declaration) => !isBlockedDeclaration(declaration)),
          ),
        }))
        .filter((rule) => rule.selector.trim() !== "" && rule.body.trim() !== "");
      commitText(serializeCssRules(rules));
      return;
    }
    commitText(
      joinDeclarations(splitDeclarations(state.text).filter((declaration) => !isBlockedDeclaration(declaration))),
    );
  });

  // Find bar (Ctrl/Cmd+F) — searches the text view and selects the match.
  const findInput = el(doc, "input");
  findInput.type = "search";
  findInput.className = "codbi-csse-input";
  findInput.placeholder = labels.find;
  findInput.style.display = "none";
  findInput.style.width = "150px";

  const findNext = (): void => {
    const needle = findInput.value.trim().toLowerCase();
    if (needle === "") {
      return;
    }
    if (state.view !== "text" && (state.kind === "stylesheet" || state.kind === "declarations")) {
      state.view = "text";
      renderAll();
    }
    const haystack = state.text.toLowerCase();
    const from = (textarea.selectionStart ?? 0) + 1;
    let index = haystack.indexOf(needle, from);
    if (index < 0) {
      index = haystack.indexOf(needle);
    }
    if (index < 0) {
      findInput.style.borderColor = "#de350b";
      return;
    }
    findInput.style.borderColor = "";
    textarea.focus();
    textarea.setSelectionRange(index, index + needle.length);
  };

  findInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      findNext();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      findInput.style.display = "none";
      textarea.focus();
    }
  });

  // Gradient generator: prefilled from the first gradient already present in the value.
  const gradientBtn = mkButton(doc, labels.gradient);
  gradientBtn.className = "codbi-csse-btn";
  gradientBtn.title = "Generate a linear/radial gradient and insert it at the caret.";
  gradientBtn.addEventListener("click", () => {
    openGradientBuilder({
      document: doc,
      anchor: gradientBtn,
      value: firstGradientIn(state.text) ?? undefined,
      onInsert: (css) => insertAtCaret(css),
    });
  });

  toolbar.append(formatBtn, minifyBtn, copyBtn, importBtn, exportBtn, fileInput, findInput);
  if (kind === "stylesheet" || kind === "declarations") {
    toolbar.appendChild(fixBlockedBtn);
    toolbar.appendChild(gradientBtn);
  }
  if (kind === "stylesheet") {
    toolbar.appendChild(dialectLabel);
  }
  // #endregion Toolbar

  // #region State plumbing
  /**
   * Commits new text into the shared state and refreshes every dependent surface.
   *
   * @param next         - The new (display form) text.
   * @param rerenderGrid - Whether the structured grid must be rebuilt. `false` while the author types
   *                       inside a grid cell: rebuilding would DESTROY the focused input (the field
   *                       lost its focus after every keystroke). Structural changes still pass `true`.
   */
  function commitText(next: string, rerenderGrid = true): void {
    state.text = next;
    if (state.kind === "classes") {
      state.classes = parseClassList(next);
    }
    refreshIssues();
    refreshSummary();
    renderIssues();
    markPreviewDirty();
    if (state.view === "text" && textarea.value !== next) {
      textarea.value = next;
      syncGutter();
    }
    if (state.view === "selector") {
      renderSelectorMatches();
    }
    if (!rerenderGrid) {
      return;
    }
    if (state.view === "rules") {
      renderRules();
    }
    if (state.view === "declarations") {
      renderDeclarations();
    }
    if (state.view === "classes") {
      renderClasses();
    }
  }

  function refreshSummary(): void {
    summaryEl.textContent = summaryText();
  }

  /** Re-renders tabs, the active view, the issues and the summary. */
  const renderAll = (): void => {
    // A rebuilt view invalidates an open picker (its buttons would target the OLD rows).
    closeSelectorPicker();
    renderTabs();
    renderView();
    refreshIssues();
    renderIssues();
    refreshSummary();
    refitPreview();
  };

  /**
   * Opens the EP builder for one declaration value input.
   *
   * @param input - The value input.
   * @param write - Applies the generated value.
   */
  function openEpFor(input: HTMLInputElement, write: (value: string) => void): void {
    try {
      openEPBuilder({
        document: doc,
        anchor: popup,
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
          write(value);
        },
      });
    } catch {
      /* the builder could not be opened — the plain input stays usable */
    }
  }

  /** Closes the popup and removes every listener it registered. */
  function close(): void {
    closeCompletions();
    // The picker lives in `document.body`, OUTSIDE the overlay — without this it survived the editor.
    closeSelectorPicker();
    doc.removeEventListener("keydown", keyHandler, true);
    overlay.removeEventListener("keydown", stopDesignerKeys);
    overlay.removeEventListener("keyup", stopDesignerKeys);
    overlay.removeEventListener("keypress", stopDesignerKeys);
    doc.body.removeEventListener("keydown", stopDesignerKeys);
    doc.body.removeEventListener("keyup", stopDesignerKeys);
    doc.body.removeEventListener("keypress", stopDesignerKeys);
    overlay.remove();
  }

  /** Applies the current state to the caller. */
  function commitAndApply(): void {
    try {
      // Remember every gradient that is actually applied, so the builder can offer it as "Recent".
      for (const gradient of allGradientsIn(state.text)) {
        rememberGradient(gradient);
      }
      options.onApply(encodePlainValue());
    } finally {
      close();
    }
  }

  /** Global key handling: Esc closes, Ctrl/Cmd+Enter applies, Ctrl/Cmd+F focuses the finder. */
  function keyHandler(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      if (acState) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
      event.preventDefault();
      findInput.style.display = "inline-block";
      findInput.focus();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      commitAndApply();
    }
  }
  // #endregion State plumbing

  // #region Wiring & initial render
  maxBtn.addEventListener("click", () => {
    setMaximized(!maximized);
  });
  cancelBtn.addEventListener("click", () => {
    close();
  });
  closeBtn.addEventListener("click", () => {
    close();
  });
  applyBtn.addEventListener("click", () => {
    commitAndApply();
  });
  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) {
      close();
    }
  });
  doc.addEventListener("keydown", keyHandler, true);

  state.view = availableViews()[0];
  textarea.value = state.text;
  if (kind === "selector") {
    selectorInput.value = state.text;
  }
  renderAll();
  // The live preview applies itself on `load`; the clone fallback needs one initial render.
  if (!options.previewSrc) {
    renderPreview();
  }
  applyBtn.focus();
  // #endregion Wiring & initial render
}

/** The editor's internal view ids. */
type TView = "text" | "rules" | "declarations" | "classes" | "selector";

/**
 * @returns the character index at which the given 1-based line starts.
 *
 * @param lines - The value split into lines.
 * @param line  - The 1-based line number.
 */
function nextLineStart(lines: ReadonlyArray<string>, line: number): number {
  const target = Math.max(1, Math.min(line, lines.length));
  let index = 0;
  for (let i = 0; i < target - 1; i += 1) {
    index += lines[i].length + 1;
  }
  return index;
}
// #endregion Editor
