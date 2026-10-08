import {
  registerCustomCategory,
  registerCustomEditor,
  registerCustomProperty,
  registerLocalizableProperty,
} from "@de-xima/fc-form-designer";
import { Constants } from "codbi-common";
import {
  MirrorElementSelect,
  MirrorElementSelectType,
  type IMirrorElementSelectDescriptor,
} from "./MirrorElementSelect.js";
import { MirrorFormSelect, MirrorFormSelectType, type IMirrorFormSelectDescriptor } from "./MirrorFormSelect.js";
import { ensureCodbiBranding } from "./MirrorSelect.js";
import { i18n } from "./i18n.js";

/** Category id grouping the Mirror widget's properties in the element properties panel. */
export const MIRROR_CATEGORY_ID = "codbi-cat-mirror";

/**
 * Registers the CodBi Mirror widget's designer UI:
 * - a dedicated “Communication” category in the element properties panel, and
 * - the source-form dropdown plus the dependent source-element dropdown (both custom editors using
 *   the shared Mirror dropdown UI with the assistant look and a hover preview).
 *
 * Both properties are registered as localizable so they stay editable in EVERY form language, not
 * just the default one.
 */
export function registerCustomMirrorProperties(): void {
  try {
    // Publishes the CodBi logo URL for the settings-panel watermark (CSS `--codbi-logo-url`).
    ensureCodbiBranding();
    registerCustomCategory(
      { id: MIRROR_CATEGORY_ID, label: i18n("designer.category.communication") },
      (items) => items.length,
    );

    const formProperty = String(Constants["mirror.property.form"]);
    const elementProperty = String(Constants["mirror.property.element"]);

    registerLocalizableProperty(formProperty);
    registerLocalizableProperty(elementProperty);

    try {
      registerCustomEditor(MirrorFormSelectType, MirrorFormSelect);
    } catch (x) {
      console.error("[CodBi] Failed to register the Mirror form editor", x);
    }
    try {
      registerCustomEditor(MirrorElementSelectType, MirrorElementSelect);
    } catch (x) {
      console.error("[CodBi] Failed to register the Mirror element editor", x);
    }

    registerCustomProperty({
      editor: MirrorFormSelectType,
      cat: MIRROR_CATEGORY_ID,
      property: formProperty,
      label: i18n("designer.widget.mirror.form"),
    } satisfies IMirrorFormSelectDescriptor);

    registerCustomProperty({
      editor: MirrorElementSelectType,
      cat: MIRROR_CATEGORY_ID,
      property: elementProperty,
      label: i18n("designer.widget.mirror.element"),
    } satisfies IMirrorElementSelectDescriptor);
  } catch (x) {
    // Never let the Mirror registration abort the other CodBi designer registrations.
    console.error("[CodBi] Failed to register the Mirror widget's designer properties", x);
  }
}
