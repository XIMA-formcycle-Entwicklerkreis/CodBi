import { registerCustomTranslations } from "@de-xima/fc-form-designer";

/**
 * Registers the FORMCYCLE `ButtonsEditor` action labels used by the XButtonList
 * action dropdown and by the designer's "Aktion" column.
 *
 * The designer derives a button action's label from `ButtonsEditor.<page>` plus
 * `" + " + ButtonsEditor.check` (see the designer's `Ct`/`Pt` helpers). The
 * navigation actions `next`/`previous` have no built-in entry, so the designer
 * falls back to `${page} ${keyword} + check` — e.g. English "page next + check"
 * or German "Seite next + prüfen" — instead of the proper localized label.
 * Registering the two missing keys makes both the dropdown option text and the
 * "Aktion" column show "next page + check" / "weiter + prüfen".
 *
 * This only affects the human-readable LABEL. The action's stored id
 * (`optionId`) is untouched and stays the machine value produced by the
 * designer's `St(page, check)` (e.g. "next + check", "submit + check").
 */
export function registerButtonActionTranslations(): void {
  registerCustomTranslations({
    default: {
      ButtonsEditor: {
        next: "next page",
        previous: "previous page",
      },
    },
    de: {
      ButtonsEditor: {
        next: "weiter",
        previous: "zurück",
      },
    },
    en: {
      ButtonsEditor: {
        next: "next page",
        previous: "previous page",
      },
    },
  });
}
