// #region Imports
import { instance } from "@de-xima/fc-form-designer";
import { Constants, type TStandardConfigClassSpec } from "codbi-common";

import {
  notifyFormPreviewChanged,
  refreshCodbiElementMarkers,
  resumeElementPreviews,
  suspendElementPreviews,
} from "./CodbiElementMarkers.js";
import { getDesignerLanguage, i18n as i18nTyped, localizedFunctionalitySummary } from "./i18n.js";
// #endregion Imports

/**
 * Standard-configuration **activation** — shared by the per-element CodBi config panel and the
 * on-canvas CodBi marker badges.
 *
 * A standard configuration's CSS class is only a MARKER on its own: the behaviour (e.g. "no future
 * dates" for `CodBi_NoFutureDate`) is applied by the owning configuration's script, which FORMCYCLE
 * only injects for the form when that configuration is **active** (`codbi-prop-standards`).
 *
 * Both surfaces therefore behave identically:
 *
 * - a class of a NOT activated configuration is DIMMED (the listing row in the config panel, the blue
 *   class sub-badge of the marker), and
 * - acting on it (toggling its checkbox / clicking the dimmed sub-badge) ASKS whether the owning
 *   configuration shall be activated (see {@link confirmStandardConfigActivation}); confirming
 *   activates it so the marker becomes fully effective.
 *
 * Keeping this in ONE module guarantees the panel and the canvas badge cannot drift apart.
 */

/** Loosened `i18n` accessor — the keys are added to the generated union asynchronously. */
const kI18n = i18nTyped as unknown as (key: string) => string;

/** One CSS class a standard configuration provides (`classes[cssClass]`), with its short description. */
export interface IStandardConfigClassEntry {
  /** The CSS class name (e.g. `CodBi_NoFutureDate`). */
  cssClass: string;
  /** The class's short description, prefixed with the owning configuration's path. */
  description: string;
}

/** Options accepted by {@link activateStandardConfig} and {@link confirmStandardConfigActivation}. */
export interface IStandardConfigActivationOptions {
  /**
   * Standard-configuration ids the CALLER already considers active in addition to the persisted
   * `codbi-prop-standards` CSV and the `Active` flags (e.g. activations performed earlier in the same
   * panel instance, which cannot be read back yet).
   */
  extraActiveIds?: readonly string[];
  /**
   * The `sender` passed to the designer's `set-property` callback on the fallback path (the form-level
   * standards tree passes the editor itself). Optional — the callback tolerates `undefined` in the
   * surfaces that do not have a property editor.
   */
  sender?: unknown;
  /**
   * Invoked after a configuration was successfully activated (e.g. to remember it locally and to
   * re-render a listing).
   */
  onActivated?: (configId: string) => void;
  /**
   * Invoked once the question was ANSWERED (before the element previews are resumed).
   *
   * @param answered **True** when the user confirmed the activation; **false** when the question was
   *   dismissed or the backdrop was clicked.
   */
  onClose?: (answered: boolean) => void;
}

/**
 * Replaces the `{0}`, `{1}`, … placeholders of an i18n message with the given values.
 *
 * @param message The localized message (may contain `{n}` placeholders).
 * @param values  The replacement values, in placeholder order.
 * @returns The message with every present placeholder replaced.
 */
export function formatMessage(message: string, ...values: string[]): string {
  return values.reduce((text, value, index) => text.split(`{${index}}`).join(value), String(message ?? ""));
}

/**
 * The standard-configuration ids currently active for the edited form: the persisted
 * `codbi-prop-standards` CSV merged with every configuration flagged `Active` (the latter also covers
 * a toggle that was not persisted yet) plus any caller-supplied extra ids.
 *
 * The ids are kept in their ORIGINAL casing and order — the runtime resolves them as file names
 * (`Appointments.js`), which is case-sensitive.
 *
 * @param extra Ids to treat as active in addition to the persisted/flagged ones.
 */
/**
 * Queues a standards CSV for the form-level "Standard Configurations" editor.
 *
 * The editor (`MultiSelect`) reads `window.CodbiPluginData.pendingStandards` / the
 * `codbi-pending-standards` session key **in its constructor** and applies the value through its own
 * `setStandardsValue`, which persists `codbi-prop-standards`. Writing the queue is therefore the
 * reliable way to make an activation performed ELSEWHERE (the per-element panel, a marker badge)
 * show up CHECKED in that listing.
 *
 * @param csv The complete standards CSV (existing ids plus the newly activated one).
 */
/**
 * The **form-level** standards editor instance (`MultiSelect` of `codbi-prop-standards`), or
 * `undefined` while that panel has not been built (it is created lazily when the form's CodBi
 * options are opened).
 *
 * Its `setStandardsValue` is the ONLY reliable writer of the persisted standards CSV: it updates the
 * checkboxes AND fires the designer's `set-property` callback with the correct sender.
 */
function resolveStandardsEditor():
  | { setStandardsValue?: (csv: string) => void; config?: { property?: string } }
  | undefined {
  try {
    const designer = instance() as unknown as
      | {
          getPropertyView?: () =>
            | {
                getEditorForProperty?: (property: string) => unknown;
                getPropertyEditors?: () => ReadonlyArray<{ config?: { property?: string } }>;
              }
            | undefined;
        }
      | undefined;
    const view = designer?.getPropertyView?.();
    const property = Constants["designer.property.standards"];
    const candidate =
      (view?.getEditorForProperty?.(property) as { setStandardsValue?: (csv: string) => void } | undefined) ??
      (view?.getPropertyEditors?.().find((entry) => entry?.config?.property === property) as
        | { setStandardsValue?: (csv: string) => void }
        | undefined);
    return candidate ?? undefined;
  } catch {
    return undefined;
  }
}

function queuePendingStandards(csv: string): void {
  try {
    window.CodbiPluginData.pendingStandards = csv;
  } catch {
    /* registry not writable — the sessionStorage channel below still applies */
  }
  try {
    sessionStorage.setItem("codbi-pending-standards", csv);
  } catch {
    /* storage unavailable — nothing can be queued */
  }
}

export function activeStandardConfigIds(extra: readonly string[] = []): string[] {
  const result: string[] = [];
  const add = (raw: unknown): void => {
    for (const entry of String(raw ?? "").split(",")) {
      const id = entry.trim();
      if (id !== "" && !result.some((existing) => existing.toLowerCase() === id.toLowerCase())) {
        result.push(id);
      }
    }
  };
  try {
    const designer = instance() as unknown as
      | { getFormPropertyValueForCurrentLang?: (property: string) => unknown }
      | undefined;
    add(designer?.getFormPropertyValueForCurrentLang?.(Constants["designer.property.standards"]));
  } catch {
    // No form-property model available — the `Active` flags below still provide the selection.
  }
  try {
    for (const [id, def] of Object.entries(window.CodbiPluginData?.detStandards ?? {})) {
      if (def?.Active) {
        add(id);
      }
    }
  } catch {
    /* ignore */
  }
  for (const id of extra) {
    add(id);
  }
  return result;
}

/**
 * The id of the standard CONFIGURATION that provides the CSS class `cssClass`.
 *
 * @param cssClass The standard-configuration CSS class (e.g. `CodBi_NoFutureDate`).
 * @returns The owning configuration id, or **undefined** when no configuration provides that class.
 */
export function standardConfigOwnerOfClass(cssClass: string): string | undefined {
  try {
    const standards = window.CodbiPluginData?.detStandards ?? {};
    return Object.keys(standards).find((id) => {
      const classes = standards[id]?.classes;
      return classes != null && Object.prototype.hasOwnProperty.call(classes, cssClass);
    });
  } catch {
    return undefined;
  }
}

/**
 * Whether the standard configuration `configId` is currently active for the edited form.
 *
 * @param configId The standard-configuration id (case-insensitive).
 * @param extra    Ids to treat as active in addition to the persisted/flagged ones.
 */
export function isStandardConfigActive(configId: string, extra: readonly string[] = []): boolean {
  const wanted = String(configId ?? "")
    .trim()
    .toLowerCase();
  return wanted !== "" && activeStandardConfigIds(extra).some((id) => id.toLowerCase() === wanted);
}

/**
 * Whether the standard configuration that provides `cssClass` is NOT activated for the form — i.e.
 * whether the class is currently only a (dimmed) marker.
 *
 * @param cssClass The standard-configuration CSS class.
 * @param extra    Ids to treat as active in addition to the persisted/flagged ones.
 */
export function standardConfigClassIsInactive(cssClass: string, extra: readonly string[] = []): boolean {
  const owner = standardConfigOwnerOfClass(cssClass);
  return owner !== undefined && !isStandardConfigActive(owner, extra);
}

/**
 * Cache of the lowercase → ORIGINAL-key index of `detFunctionalities`.
 *
 * The standard-configuration tooltip resolves the summaries of every FUNC the class applies, for every
 * class of every configuration, on EVERY panel render — a linear scan per FUNC made that O(n²). The
 * index is rebuilt only when the registry object or its key count changes; the entry is read from the
 * live registry, so in-place updates are still picked up.
 */
let summaryKeyIndexSource: object | undefined;
let summaryKeyIndexCount = -1;
let summaryKeyIndex: Map<string, string> | undefined;

/** @returns The lowercase → original-casing key index of `data` (rebuilt only when it changed). */
function summaryKeyIndexFor(data: Record<string, unknown>): Map<string, string> {
  const keys = Object.keys(data);

  if (
    summaryKeyIndex === undefined ||
    summaryKeyIndexSource !== (data as object) ||
    summaryKeyIndexCount !== keys.length
  ) {
    const index = new Map<string, string>();

    for (const key of keys) {
      index.set(key.toLowerCase(), key);
    }

    summaryKeyIndex = index;
    summaryKeyIndexSource = data as object;
    summaryKeyIndexCount = keys.length;
  }

  return summaryKeyIndex;
}

/**
 * The short (one-sentence) description of a functionality for the current designer language, read
 * straight from `detFunctionalities` (no dependency on the functionality config editor).
 *
 * @param id The functionality id (matched case-insensitively).
 */
function functionalitySummaryOf(id: string): string {
  try {
    const data = (window.CodbiPluginData?.detFunctionalities ?? {}) as Record<
      string,
      { Summary?: string | Record<string, string> } | undefined
    >;
    const wanted = String(id ?? "")
      .trim()
      .toLowerCase();
    const key = summaryKeyIndexFor(data).get(wanted);

    if (key !== undefined) {
      return localizedFunctionalitySummary(data[key]?.Summary);
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * Tooltip text of one standard-configuration class.
 *
 * The text is LOCALIZED, most specific source first:
 *
 * 1. the class's own translated description (`classes[class].descriptionDe` / `.descriptionIt`,
 *    hand-authored in the configuration metadata) — the only source for the classes that apply NO
 *    functionality (e.g. the marker classes of a date/time pair);
 * 2. for any other language, the localized short summaries of the functionalities the class applies;
 * 3. the published (English) class description.
 *
 * The text is PREFIXED with the owning standard configuration's full path (``Appointments › …``),
 * because that is what the user has to activate in the form's CodBi section for the class to have its
 * effect. An inactive configuration additionally appends an explicit hint.
 *
 * @param id           The owning standard-configuration id (its full path).
 * @param label        The CSS class name.
 * @param classSpec    The class's published entry (description + optional localized descriptions).
 * @param funcsCsv     The comma-separated FUNC list the class applies.
 * @param configActive Whether the owning configuration is ACTIVE for the form.
 */
export function standardConfigTooltip(
  id: string,
  label: string,
  classSpec: TStandardConfigClassSpec | undefined,
  funcsCsv: string | undefined,
  configActive: boolean,
): string {
  const spec = classSpec != null && typeof classSpec === "object" ? classSpec : undefined;
  const published = typeof classSpec === "string" ? classSpec : spec?.description;
  const language = getDesignerLanguage().toLowerCase();
  // The class's OWN translation wins (it describes the class, not a functionality).
  const translated = language.startsWith("de")
    ? spec?.descriptionDe
    : language.startsWith("it")
      ? spec?.descriptionIt
      : undefined;
  let body = translated || published || id;
  if (!translated && language !== "en") {
    const summaries = String(funcsCsv ?? "")
      .split(",")
      .map((func) => func.trim())
      .filter(Boolean)
      .map((func) => functionalitySummaryOf(func))
      .filter(Boolean);
    const unique = [...new Set(summaries)];
    if (unique.length > 0) {
      body = unique.join(" · ");
    }
  }
  const lines = [`${id} › ${body}`];
  if (!configActive) {
    lines.push(formatMessage(kI18n("designer.element.standardConfig.inactiveHint"), id));
  }
  return lines.join("\n");
}

/**
 * Every CSS class a standard configuration provides, together with the SHORT DESCRIPTION used by the
 * listing tooltips and the activation dialog (``Appointments › Prevents selecting future dates.``).
 *
 * @param configId The standard-configuration id.
 * @returns The class entries (empty when the configuration provides none or is unknown).
 */
export function standardConfigClassEntries(configId: string): IStandardConfigClassEntry[] {
  try {
    const def = window.CodbiPluginData?.detStandards?.[configId];
    const classes = def?.classes;
    if (classes == null) {
      return [];
    }
    return Object.keys(classes).map((cssClass) => ({
      cssClass,
      description: standardConfigTooltip(configId, cssClass, classes[cssClass], def?.funcs?.[cssClass], true),
    }));
  } catch {
    return [];
  }
}

/**
 * Makes the standard CONFIGURATION `configId` active for the edited form, so its script is injected
 * for the form and every class it provides does what it promises.
 *
 * Four paths, most reliable first:
 *
 * 1. `CodbiPluginData.setStandardsValue` — the form-level standards editor, which persists
 *    `codbi-prop-standards`, updates the `Active` flags and re-applies running element previews.
 * 2. That same editor, resolved through the designer's property view (`getEditorForProperty`) — it
 *    exists even when the plugin hook was never published.
 * 3. The QUEUE the editor consumes in its constructor (`pendingStandards` / sessionStorage) plus the
 *    `Active` flag — the case where the form's CodBi options were never opened, so no editor exists
 *    yet. Firing the designer's `set-property` callback instead does NOT work: it acts on the SENDER
 *    editor's own property (reported as "the configuration stays unchecked").
 * 4. The standards tree's checkbox, if it happens to be rendered.
 *
 * @param configId The standard-configuration id to activate.
 * @param options  Optional extra active ids, callback sender and success hook.
 * @returns **True** when the configuration was activated, **false** when it already was or could not
 *   be activated.
 */
export function activateStandardConfig(configId: string, options: IStandardConfigActivationOptions = {}): boolean {
  const id = String(configId ?? "").trim();
  if (id === "") {
    return false;
  }
  try {
    if (isStandardConfigActive(id, options.extraActiveIds)) {
      return false; // Already active — nothing to do.
    }
    const next = [...activeStandardConfigIds(options.extraActiveIds), id].join(",");
    const apply = window.CodbiPluginData?.setStandardsValue;
    if (typeof apply === "function") {
      apply(next);
      options.onActivated?.(id);
      refreshCodbiElementMarkers();
      return true;
    }
    // The standards EDITOR instance resolved through the designer — the same object that publishes
    // `setStandardsValue`, but reachable even when that plugin hook was not set (an older bundle).
    const editor = resolveStandardsEditor();
    if (editor && typeof editor.setStandardsValue === "function") {
      editor.setStandardsValue(next);
      options.onActivated?.(id);
      notifyFormPreviewChanged();
      refreshCodbiElementMarkers();
      return true;
    }
    // No standards editor instance this session: persist the property through the designer's own
    // callback and mark the configuration ACTIVE (the canvas badges read that flag).
    const standardsDef = window.CodbiPluginData?.detStandards?.[id];
    if (standardsDef) {
      standardsDef.Active = true;
    }
    // The form-level standards editor is only CONSTRUCTED once the form's CodBi options were opened
    // in this session, so `setStandardsValue` does not exist yet on most activations. Queue the new
    // CSV in the very channel that editor consumes on construction (see `MultiSelect`'s
    // constructor) — otherwise the configuration was activated for the element panel/preview but
    // stayed UNCHECKED in the form-level listing (reported), and the next panel build cleared the
    // `Active` flag again because the persisted CSV never contained the id.
    queuePendingStandards(next);
    // NOTE: `Callbacks["set-property"]` is deliberately NOT fired here any more. The callback acts on
    // the SENDER editor (`sender.config.property` / `sender.getValue()`), and every internal caller
    // passes an editor bound to the edited property. Firing it with the ELEMENT panel as sender never
    // persisted the standards CSV (reported: the configuration stayed unchecked in the form-level
    // listing even after a reload) — it could even target the element's own property. The two paths
    // above plus the queue below are the reliable ones.
    // Last resort: tick the form-level tree's checkbox; its `change` handler persists the selection.
    const checkbox = document.getElementById(`CodBi-StandardConfigSelector_${id}`);
    if (checkbox instanceof HTMLInputElement && !checkbox.checked) {
      checkbox.checked = true;
      checkbox.dispatchEvent(new Event("change", { bubbles: true }));
      options.onActivated?.(id);
      notifyFormPreviewChanged();
      refreshCodbiElementMarkers();
      return true;
    }
    // Neither an editor instance nor a rendered checkbox: the QUEUE written above is still the
    // authoritative hand-over (the form-level list applies it when it is constructed). The
    // configuration is flagged ACTIVE for this session, so the panel row and the canvas badge stop
    // marking it — reported as "activation does nothing" while it was actually queued.
    console.info(
      `[CodBi] Standard configuration "${id}" was queued for the form's standard-configuration list and is applied as soon as that list is built.`,
    );
    options.onActivated?.(id);
    notifyFormPreviewChanged();
    refreshCodbiElementMarkers();
    return true;
  } catch (x) {
    console.warn("[CodBi] Could not activate the standard configuration", x);
    return false;
  }
}

/**
 * Asks the user whether the standard configuration `configId` shall be activated for the form.
 *
 * Used by BOTH surfaces: the per-element CodBi config panel (when a class of a not activated
 * configuration is applied) and the on-canvas marker (when the DIMMED class sub-badge is clicked).
 * The dialog names the configuration and lists every class it provides — each entry with the class's
 * short description as its tooltip — so it is clear what becomes available. Confirming activates the
 * configuration; dismissing leaves everything as it is.
 *
 * While the question is OPEN all element previews are frozen ({@link suspendElementPreviews}): every
 * draft sync / badge refresh / preview (re)fit makes FORMCYCLE re-render the cell, and a preview
 * rebuilt under the modal comes back clipped with the platform's own preview chrome visible — for a
 * decision the user has not even taken yet. The freeze is released in the dialog's `close()`.
 *
 * @param configId The standard-configuration id.
 * @param classes  The classes that configuration provides, with their short descriptions.
 * @param options  Optional extra active ids, success hook and close hook.
 */
export function confirmStandardConfigActivation(
  configId: string,
  classes: IStandardConfigClassEntry[],
  options: IStandardConfigActivationOptions = {},
): void {
  // Only ONE question at a time: a leftover dialog (e.g. from a previous element selection) is
  // replaced instead of stacking a second overlay on top of it.
  for (const stale of Array.from(document.querySelectorAll(".codbi-std-activate-overlay"))) {
    stale.remove();
  }
  const overlay = document.createElement("div");
  overlay.className = "codbi-std-activate-overlay";
  const dialog = document.createElement("div");
  dialog.className = "codbi-std-activate-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");

  const title = document.createElement("h3");
  title.textContent = kI18n("designer.element.standardConfig.dialog.title");
  const message = document.createElement("p");
  message.textContent = formatMessage(kI18n("designer.element.standardConfig.dialog.message"), configId);
  dialog.append(title, message);

  if (classes.length > 0) {
    const classesLabel = document.createElement("p");
    classesLabel.textContent = kI18n("designer.element.standardConfig.dialog.classes");
    const list = document.createElement("ul");
    list.className = "codbi-std-activate-dialog__list";
    for (const { cssClass, description } of classes) {
      const entry = document.createElement("li");
      entry.textContent = cssClass;
      // The short description (prefixed with the configuration path) is shown on hover, exactly like
      // the listing rows do it — the dialog must not be the only place without it.
      if (description) {
        entry.title = description;
      }
      list.append(entry);
    }
    dialog.append(classesLabel, list);
  }

  const actions = document.createElement("div");
  actions.className = "codbi-std-activate-dialog__actions";
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "codbi-std-activate-dialog__cancel";
  cancel.textContent = kI18n("designer.element.standardConfig.dialog.cancel");
  const confirm = document.createElement("button");
  confirm.type = "button";
  confirm.className = "codbi-std-activate-dialog__confirm";
  confirm.textContent = kI18n("designer.element.standardConfig.dialog.confirm");
  actions.append(cancel, confirm);
  dialog.append(actions);

  /**
   * Closes the question.
   *
   * @param answered **True** when the user CONFIRMED (the canvas/previews then have to catch up
   *   exactly once); **false** when the question is dismissed — the user declined, so nothing may be
   *   re-actualised: the freeze is released WITHOUT re-applying any preview.
   */
  const close = (answered: boolean): void => {
    document.removeEventListener("keydown", onKeyDown);
    overlay.remove();
    try {
      options.onClose?.(answered);
    } catch (x) {
      console.warn("[CodBi] Standard configuration: the close hook failed", x);
    }
    resumeElementPreviews(answered);
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      close(false);
    }
  };
  cancel.addEventListener("click", () => close(false));
  confirm.addEventListener("click", () => {
    close(true);
    activateStandardConfig(configId, options);
  });
  // A click on the backdrop (not inside the dialog) dismisses the question.
  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) {
      close(false);
    }
  });
  suspendElementPreviews();
  document.addEventListener("keydown", onKeyDown);
  overlay.append(dialog);
  document.body.append(overlay);
  // The primary action is focused, so ENTER confirms and ESC cancels.
  confirm.focus();
}

/**
 * Convenience entry point for the on-canvas marker badges: asks whether the standard configuration
 * that provides `cssClass` shall be activated — but only when it is NOT active yet, in which case the
 * class is merely a (dimmed) marker.
 *
 * @param cssClass The standard-configuration CSS class whose (dimmed) sub-badge was clicked.
 * @param options  Optional extra active ids, success hook and close hook.
 * @returns **True** when the question was opened, **false** when the owning configuration is already
 *   active or no configuration provides that class.
 */
export function requestStandardConfigActivation(
  cssClass: string,
  options: IStandardConfigActivationOptions = {},
): boolean {
  const owner = standardConfigOwnerOfClass(cssClass);
  if (owner === undefined || isStandardConfigActive(owner, options.extraActiveIds)) {
    return false;
  }
  confirmStandardConfigActivation(owner, standardConfigClassEntries(owner), options);
  return true;
}
