import { getJQuery } from "@de-xima/fc-form-renderer";
/**
 * Invokes {@link codbi.checkAttributes()} once document has fully loaded and Formcycle
 * has finished initializing it's repeatable containers. */
export function onDocumentReady(): void {
  if (window.codbi.autoCheckAttributes) {
    getJQuery()("form.xm-form").on("ready", (event) => {
      if (!window.codbi.formReady) {
        window.codbi.formReady = true;

        window.codbi.checkAttributes();
      }
    });
  }
}
