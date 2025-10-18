/**
 * Invokes {@link codbi.checkAttributes()} right away and once again
 * when the document is fully loaded.   */
export function onDocumentReady(): void {
  if (window.codbi.autoCheckAttributes) {
    window.codbi.checkAttributes();

    window.addEventListener("load", (event) => {
      if (window.codbi.autoCheckAttributes) {
        window.codbi.checkAttributes();
      }
    });
  }
}
