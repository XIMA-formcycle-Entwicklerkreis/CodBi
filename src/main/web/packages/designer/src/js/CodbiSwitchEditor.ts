// #region Imports
import { $, Callbacks, Editors, type IPropertyDescriptor, type TEditorCfg } from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
import { i18n } from "./i18n.js";
// #endregion Imports

/**
 * Custom property editor rendering **two slider switches** side by side for the CodBi element
 * markers:
 * - the primary switch edits this editor's own form property ("Mark CodBi elements"),
 * - the companion switch (to its RIGHT) edits the {@link SECONDARY_PROPERTY} form property
 *   ("always show the reference" — expands every marker without hovering).
 *
 * FORMCYCLE renders one property per row and has no switch/slider editor, so rendering both toggles
 * inside a single editor is the only way to place the companion switch directly next to the primary
 * one. Values are persisted exactly like the checkbox editor (`"1"` / `"0"`).
 */

/** Editor type id for the CodBi slider switch. */
export const CodbiSwitchEditorType =
  "com.github.xima_formcycle_entwicklerkreis.fc.plugin:fc-plugin-codbi:CodbiSwitchEditor";

/** Describes {@link CodbiSwitchEditorType}. */
export interface ICodbiSwitchEditorDescriptor extends IPropertyDescriptor<typeof CodbiSwitchEditorType> {
  /** Value persisted for the "on" state (default `"1"`). */
  onValue?: string;
  /** Value persisted for the "off" state (default `"0"`). */
  offValue?: string;
  /**
   * Whether to also render the companion switch (right of the primary one) that edits the
   * {@link SECONDARY_PROPERTY} ("always show the reference"). Default `true`. Set `false` when the
   * companion belongs next to only ONE of the editor's rows — otherwise a property reusing this
   * editor (e.g. "Preview") would show a duplicate companion switch.
   */
  showCompanion?: boolean;
}

/** Augments **@de-xima/fc-form-designer** so the editor is known to the {@link IEditorMap}. */
declare module "@de-xima/fc-form-designer" {
  export interface IEditorMap {
    [CodbiSwitchEditorType]: {
      descriptor: ICodbiSwitchEditorDescriptor;
      editor: CodbiSwitchEditor;
      value: string;
    };
  }
}

/**
 * Document event dispatched whenever either switch is flipped (and whenever the designer seeds a
 * value). The CodBi element-markers overlay (`CodbiElementMarkers.ts`) listens for it so the canvas
 * reacts immediately — independent of whether the designer persists the form properties.
 *
 * The `detail` carries the edited `property`, so the overlay can tell the “Mark elements” switch
 * apart from the “Preview” switch (both reuse this editor and both report `enabled`).
 */
export const MARK_ELEMENTS_CHANGED_EVENT = "codbi:mark-elements:changed";

/** Tooltip shown on the property label and the primary slider. */
const ALT_V_TOOLTIP = "ALT + V";

/** Form property of the companion switch (right of the primary one). */
const SECONDARY_PROPERTY = String(Constants["designer.property.mark_labels"]);

/** A built switch: its hidden `input` and its visible `<label>` wrapper. */
interface IBuiltSwitch {
  input: HTMLInputElement;
  label: HTMLLabelElement;
}

/** The slider switch property editor. */
export class CodbiSwitchEditor extends Editors.BaseEditor<typeof CodbiSwitchEditorType> {
  private readonly onValue: string;
  private readonly offValue: string;
  private readonly root: HTMLDivElement;
  private readonly primary: HTMLInputElement;
  private readonly secondary: HTMLInputElement;
  private value: string;

  constructor(config: TEditorCfg<ICodbiSwitchEditorDescriptor>) {
    // Note: the second argument is deprecated, we pass the empty string.
    super(config, "", "text");
    this.onValue = config.onValue ?? "1";
    this.offValue = config.offValue ?? "0";
    this.value = this.offValue;

    // The companion "always show the reference" switch may be hidden (see `showCompanion`) when a
    // property reuses this editor but must not duplicate the companion next to it. The companion
    // INPUT is still built (and seeded) either way so it is a real, independent element — aliasing it
    // to the primary would make `setValue`/`notifyChanged` overwrite the primary with the
    // `mark_labels` value and the primary switch could no longer be toggled.
    const showCompanion = config.showCompanion !== false;
    const primary = this.buildSwitch(`${config.id || `form-${config.property}`}-input`, ALT_V_TOOLTIP);
    const secondary = this.buildSwitch(`form-${SECONDARY_PROPERTY}-input`, i18n("designer.property.mark_labels"));
    this.primary = primary.input;
    this.secondary = secondary.input;

    this.primary.addEventListener("change", () => {
      this.value = this.primary.checked ? this.onValue : this.offValue;
      this.persist(this.config.property, this.value);
      this.notifyChanged();
    });
    this.secondary.addEventListener("change", () => {
      this.persist(SECONDARY_PROPERTY, this.secondary.checked ? this.onValue : this.offValue);
      this.notifyChanged();
    });

    this.root = document.createElement("div");
    this.root.className = "codbi-switch-row";
    if (showCompanion) {
      // Caption shown to the RIGHT of the companion switch.
      const secondaryCaption = document.createElement("span");
      secondaryCaption.className = "codbi-switch__caption";
      secondaryCaption.textContent = i18n("designer.marker.detail");
      // The companion switch and its caption sit inside a rounded dark-orange box.
      const secondaryGroup = document.createElement("span");
      secondaryGroup.className = "codbi-switch-group";
      secondaryGroup.append(secondary.label, secondaryCaption);
      this.root.append(primary.label, secondaryGroup);
    } else {
      // Hide the companion's chrome (only its label/track), but keep the input mounted so its state
      // is still seeded from the persisted `mark_labels` value.
      secondary.label.style.display = "none";
      secondary.label.append(secondary.input);
      this.root.appendChild(primary.label);
    }

    // Seed the companion switch from the persisted value (the designer may not call `setValue` for
    // a property that has no dedicated editor row).
    this.secondary.checked = readBoolean(config.designer, SECONDARY_PROPERTY);
    this.applyLabelTooltip();
  }

  /** Builds one `<label class="codbi-switch"><input><span.track>…</span></label>` switch. */
  private buildSwitch(id: string, title: string): IBuiltSwitch {
    const label = document.createElement("label");
    label.className = "codbi-switch";
    label.title = title;

    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "codbi-switch__input";
    input.id = id;
    input.title = title;

    const track = document.createElement("span");
    track.className = "codbi-switch__track";
    const thumb = document.createElement("span");
    thumb.className = "codbi-switch__thumb";
    track.appendChild(thumb);

    label.append(input, track);
    return { input, label };
  }

  /** Notifies the overlay of the current state of both switches. */
  private notifyChanged(): void {
    try {
      document.dispatchEvent(
        new CustomEvent(MARK_ELEMENTS_CHANGED_EVENT, {
          detail: {
            // Which form property this primary switch edits (the editors for "Mark elements" and
            // "Preview" are separate instances, so the overlay can attribute the state correctly).
            property: this.config.property,
            enabled: this.primary.checked,
            showLabels: this.secondary.checked,
          },
        }),
      );
    } catch {
      /* ignore */
    }
  }

  /** Persists a form property, best effort (the designer is responsible for the actual write). */
  private persist(property: string, value: string): void {
    try {
      Callbacks["set-property"].fire(property, value, this);
    } catch (x) {
      console.error(`[CodBi] Failed to persist the '${property}' form property`, x);
    }
  }

  /** Sets the "ALT + V" tooltip on the property label (once it exists). */
  private applyLabelTooltip(): void {
    try {
      this.getPropertyLabel().attr("title", ALT_V_TOOLTIP);
    } catch {
      /* the label may not exist yet — the descriptor's `title` also covers the tooltip */
    }
  }

  show(): void {
    super.show();
    // The label element is created by the designer when the editor is mounted; (re)apply the
    // tooltip here so it is present even when the constructor ran before the label existed.
    this.applyLabelTooltip();
  }

  getElement(): JQuery {
    return $(this.root);
  }

  getValue(): string {
    return this.value;
  }

  setValue(value: unknown): void {
    const text = value == null ? "" : String(value);
    // Treat "" / "0" / "false" (any case) as the OFF state, everything else as ON.
    const normalized = text.trim().toLowerCase();
    this.value = normalized === "" || normalized === this.offValue.toLowerCase() ? this.offValue : this.onValue;
    this.primary.checked = this.value !== this.offValue;
    // Keep the companion switch in sync with the persisted value on (re)load.
    this.secondary.checked = readBoolean(this.config.designer, SECONDARY_PROPERTY);
    this.notifyChanged();
  }
}

/** Reads a boolean form property from the designer, defaulting to `false`. */
function readBoolean(designer: unknown, property: string): boolean {
  try {
    const value = (
      designer as { getFormPropertyValueForCurrentLang?: (name: string) => unknown }
    )?.getFormPropertyValueForCurrentLang?.(property);
    return value === "1" || value === 1 || value === true || value === "true";
  } catch {
    return false;
  }
}
