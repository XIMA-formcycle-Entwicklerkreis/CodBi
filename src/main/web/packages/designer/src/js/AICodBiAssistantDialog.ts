import { instance as getDesignerInstance } from "@de-xima/fc-form-designer";

/**
 * Loads the `cb-manager.js` Angular bundle (which also defines `cb-ai-assistant`) and wires the
 * ALT+A hotkey to dispatch a `codbi:ai-assistant:open` event.
 *
 * The hotkey only opens the assistant when the "CodBi" checkbox (the
 * `codbi-prop-enable` form property) is enabled for the currently edited form.
 *
 * All dialog logic has been moved to the `AiAssistant` Angular component inside
 * the `codbi-apidoc` Angular project. The change log is now an inline side panel of that
 * assistant dialog (no separate `cb-ai-assistant-log` element is mounted anymore); the assistant
 * component itself handles the automatic popup when the last inference used sensitive elements
 * that are not marked as checked yet.
 */
export function enableAICodBiAssistantDialog(): void {
  const baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
  const resourceBase = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/`;

  const scriptSrc = `${resourceBase}cb-manager.js`;
  const cssSrc = `${resourceBase}cb-manager.css`;

  // Load cb-manager.js (defines both cb-manager and cb-ai-assistant)
  if (!document.querySelector(`script[src="${scriptSrc}"]`)) {
    const script = document.createElement("script");

    script.src = scriptSrc;
    document.head.appendChild(script);
  }

  // Load shared styles
  if (!document.querySelector(`link[href="${cssSrc}"]`)) {
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = cssSrc;
    document.head.appendChild(link);
  }

  // Mount the custom elements once. cb-ai-assistant is mounted here (and not only on demand) so
  // that its ngOnInit runs on every designer page load: after a workflow-triggered form reload it
  // re-opens the change-log side panel when the last inference used sensitive elements that are not
  // marked as checked yet (both via a pending localStorage value and by checking the database).
  if (!document.querySelector("cb-ai-assistant")) {
    document.body.appendChild(document.createElement("cb-ai-assistant"));
  }
  if (!document.querySelector("cb-prompt-manager")) {
    document.body.appendChild(document.createElement("cb-prompt-manager"));
  }

  // ALT+A => show the AI assistant (only when CodBi is enabled for the current form). The
  // assistant focuses the prompt textarea automatically on open.
  document.addEventListener("keyup", (event) => {
    if (event.altKey && event.key.toLowerCase() === "a" && isCodBiEnabled()) {
      document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
    }
  });
  // ALT+S (while ALT is still held, e.g. right after ALT+A) => activate the assistant's speech
  // input (only when CodBi is enabled for the current form).
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.key.toLowerCase() === "s" && isCodBiEnabled()) {
      event.preventDefault();
      document.dispatchEvent(new CustomEvent("codbi:ai-assistant:speech"));
    }
  });
}

/** Whether the "CodBi" checkbox (`codbi-prop-enable`) is set for the currently edited form. */
function isCodBiEnabled(): boolean {
  const designer = getDesignerInstance();
  if (!designer) {
    return false;
  }
  try {
    const value = designer.getFormPropertyValueForCurrentLang("codbi-prop-enable");
    return value === "1" || value === 1 || value === true;
  } catch {
    return false;
  }
}
