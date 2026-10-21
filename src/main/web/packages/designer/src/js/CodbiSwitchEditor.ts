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
 *   ("always show the reference" — expands a form element's markers while it is hovered).
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
   * {@link SECONDARY_PROPERTY} ("always show the reference", hover-driven expansion). Default
   * `true`. Set `false` when the
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
    // property reuses this editor but must not duplicate the companion next to it. It enables
    // hover-driven marker expansion (not permanent expansion). The companion
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

    const switchRow = document.createElement("div");
    switchRow.className = "codbi-switch-row";
    if (showCompanion) {
      // Caption shown to the RIGHT of the companion switch.
      const secondaryCaption = document.createElement("span");
      secondaryCaption.className = "codbi-switch__caption";
      secondaryCaption.textContent = i18n("designer.marker.detail");
      // The companion switch and its caption sit inside a rounded dark-orange box.
      const secondaryGroup = document.createElement("span");
      secondaryGroup.className = "codbi-switch-group";
      secondaryGroup.append(secondary.label, secondaryCaption);
      switchRow.append(primary.label, secondaryGroup);
    } else {
      // Hide the companion's chrome (only its label/track), but keep the input mounted so its state
      // is still seeded from the persisted `mark_labels` value.
      secondary.label.style.display = "none";
      secondary.label.append(secondary.input);
      switchRow.appendChild(primary.label);
    }

    // The editor element is ONLY the switch row, so FORMCYCLE keeps the property's label aligned with
    // the switch. The two quick links (form assistant / local API doc) get their OWN container, which
    // is moved out of this element and inserted as a separate row directly BELOW it (see
    // `mountQuickLinksAside`) — keeping them inside this container pushed the "Preview" label down.
    this.root = switchRow;
    if (String(config.property) === String(Constants["designer.property.preview_elements"])) {
      const aside = document.createElement("div");
      aside.className = "codbi-quick-links";
      aside.appendChild(this.buildQuickActions());
      this.mountQuickLinksAside(aside);
    }

    // Seed the companion switch from the persisted value (the designer may not call `setValue` for
    // a property that has no dedicated editor row).
    this.secondary.checked = readBoolean(config.designer, SECONDARY_PROPERTY);
    this.applyLabelTooltip();
  }

  /**
   * Puts the quick-links container on its OWN LINE directly below the "Preview" switch and its label.
   *
   * A sibling inserted next to the FORMCYCLE property row would be laid out by that row's parent,
   * which is a horizontal (flex/grid) container — the buttons then appeared in the same line as the
   * switch. To make the position independent of that layout, the property row is WRAPPED into a
   * column container: the wrapper takes the row's place in the parent, the row stays untouched
   * inside it, and the aside is appended after the row inside the wrapper — so it is always the next
   * line, under the label and the switch.
   *
   * FORMCYCLE inserts the editor element asynchronously after construction, so the placement is
   * retried until the element has a parent.
   */
  private mountQuickLinksAside(aside: HTMLElement): void {
    let attempts = 0;
    const place = (): void => {
      const editorCell = this.root.parentElement;
      if (!editorCell) {
        if (attempts++ < 40) {
          setTimeout(place, 50);
        }
        return;
      }
      // The property ROW is the ancestor that also holds the label: climb through single-child
      // wrappers, then one level up from the editor cell itself (the row has the LABEL and the cell
      // as its two children, so the single-child loop stops at the cell).
      let row: HTMLElement = editorCell;
      let depth = 0;
      while (
        depth < 6 &&
        row.parentElement &&
        row.parentElement !== document.body &&
        row.parentElement.children.length === 1
      ) {
        row = row.parentElement;
        depth++;
      }
      if (row === editorCell && row.parentElement && row.parentElement !== document.body) {
        row = row.parentElement;
      }
      // Drop a leftover container from a previous editor instance (the panel may be rebuilt without
      // removing the wrapper of the old row), then place this one.
      document.querySelectorAll(".codbi-quick-links").forEach((el) => {
        if (el !== aside) {
          el.remove();
        }
      });
      // Already wrapped (e.g. `place` ran twice for the same instance)? Then only ensure the aside is
      // the last child of the wrapper.
      const existingWrapper = row.parentElement?.closest(".codbi-quick-links-host");
      if (existingWrapper && existingWrapper.contains(row)) {
        existingWrapper.appendChild(aside);
        return;
      }
      const parent = row.parentElement;
      if (!parent) {
        return;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "codbi-quick-links-host";
      parent.insertBefore(wrapper, row);
      wrapper.appendChild(row);
      wrapper.appendChild(aside);
    };
    setTimeout(place, 0);
  }

  /**
   * Builds one quick-link button: an icon plus a short label, with the hotkey named in the title.
   *
   * @param modifier `--first` (rounded on the left, gradient darkening to the right) or `--last`
   *   (rounded on the right, gradient darkening to the left).
   * @param iconClass PrimeIcons class of the icon.
   * @param labelKey Message key of the visible label.
   * @param titleKey Message key of the hover title (names the hotkey).
   * @param onClick Action bound to the click.
   */
  private buildQuickAction(
    modifier: "first" | "last",
    iconClass: string,
    labelKey: string,
    titleKey: string,
    onClick: () => void,
  ): HTMLButtonElement {
    // `i18n()` is typed against the generated key union; the quick-link keys are looked up
    // dynamically, so widen the parameter type here instead of casting at every call site.
    const translate = i18n as (key: string) => string;
    const button = document.createElement("button");
    button.type = "button";
    button.className = `codbi-quick-action codbi-quick-action--${modifier}`;
    const title = translate(titleKey);
    button.title = title;
    button.setAttribute("aria-label", title);
    const icon = document.createElement("i");
    icon.className = iconClass;
    icon.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.className = "codbi-quick-action__label";
    label.textContent = translate(labelKey);
    button.append(icon, label);
    button.addEventListener("click", (event) => {
      event.preventDefault();
      onClick();
    });
    return button;
  }

  /**
   * Builds the two quick links shown below the "Preview" switch: the form assistant and the local API
   * doc manager. Kept as ONE segmented control (no gap, adjacent halves rounded on their outer edge),
   * each with an icon and a label.
   */
  private buildQuickActions(): HTMLDivElement {
    const group = document.createElement("div");
    group.className = "codbi-quick-actions";
    const assistant = this.buildQuickAction(
      "first",
      "pi pi-comments",
      "designer.quicklink.assistant.label",
      "designer.quicklink.assistant",
      () => {
        // The assistant host (`cb-ai-assistant`) is mounted on every designer page load and listens
        // for this event — the same path the ALT+A hotkey uses.
        document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
      },
    );
    const docs = this.buildQuickAction(
      "last",
      "pi pi-book",
      "designer.quicklink.apidoc.label",
      "designer.quicklink.apidoc",
      () => {
        // The local API doc manager is opened by the ALT+C hotkey, which `LocalDocInterface`
        // registers as a DOCUMENT-level `keyup` listener — so replay that exact event.
        document.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: "c",
            code: "KeyC",
            altKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
      },
    );
    group.append(assistant, docs);
    return group;
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
