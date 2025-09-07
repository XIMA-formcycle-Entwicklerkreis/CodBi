/**
 * When the form finished loading. Prepares the form, registering all event
 * listeners etc.
 */
export function onDocumentReady(): void {
  window.addEventListener("load", (event) => {
    if (window.codbi.autoCheckAttributes) {
      window.codbi.checkAttributes();
    }
  });
}
