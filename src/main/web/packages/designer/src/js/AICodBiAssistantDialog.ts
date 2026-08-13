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
      openAssistant();
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

/**
 * Opens the AI assistant.
 *
 * The designer re-renders its DOM when a form is loaded in-place (inference-driven form load
 * without a page reload) and can tear down the body-level `<cb-ai-assistant>` element. When it is
 * missing, a fresh element is mounted and the `codbi:ai-assistant:open` event is dispatched until
 * the PrimeNG dialog actually becomes visible — Angular's custom-element bootstrap is asynchronous,
 * so a single fixed-delay dispatch can be lost right after such a run.
 *
 * Also remembers the manual open so {@link isCodBiEnabled} can fall back to it while the
 * form-property model is stale (see below). */
function openAssistant(): void {
  // Remember this manual open — a strong signal that CodBi is enabled for the current form, used
  // by isCodBiEnabled() while the form-property model is stale right after an inference-driven
  // in-place form load.
  try {
    localStorage.setItem("codbi-assistant-last-opened", String(Date.now()));
  } catch {
    // ignore storage errors
  }

  // Already visible — just (re)dispatch so the prompt gets focus; never touch the mounted element
  // while the dialog is open.
  if (document.querySelector(".cb-ai-assistant-dialog")) {
    document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
    return;
  }

  // Angular's custom-element bootstrap is asynchronous — poll until the dialog is visible (capped
  // at 4s), dispatching the open event only while it is not. Rate-limited to ~700ms to avoid
  // hammering open() while its initial AJAX (DB status + model list) is still running.
  const startedAt = Date.now();
  let lastDispatch = 0;
  let freshMounted = false;

  const tryOpen = (): void => {
    if (document.querySelector(".cb-ai-assistant-dialog") || Date.now() - startedAt > 4000) {
      return;
    }
    if (document.querySelector("cb-ai-assistant") && Date.now() - lastDispatch > 700) {
      lastDispatch = Date.now();
      document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
    }
    // A stale host (its Angular component was destroyed by an inference-driven in-place form load)
    // silently swallows the open event. Give it a short window to respond; only if the dialog is
    // still not visible, re-mount a fresh element ONCE. Preferring the existing host avoids
    // destroying a healthy component on every reopen — that teardown/reboot cycle used to race the
    // drag coordinator's global registry and leave the dialog undraggable (see the generation guard
    // in dialog-position.ts).
    if (!freshMounted && Date.now() - startedAt > 2000) {
      freshMounted = true;
      const stale = document.querySelector("cb-ai-assistant");

      if (stale) {
        stale.remove();
      }
      document.body.appendChild(document.createElement("cb-ai-assistant"));
    }
    setTimeout(tryOpen, 250);
  };

  // Try the existing (possibly live) host first; only create one when none is mounted.
  if (!document.querySelector("cb-ai-assistant")) {
    document.body.appendChild(document.createElement("cb-ai-assistant"));
  }
  setTimeout(tryOpen, 150);
}

/** Whether the "CodBi" checkbox (`codbi-prop-enable`) is set for the currently edited form. */
function isCodBiEnabled(): boolean {
  const designer = getDesignerInstance();

  if (designer) {
    try {
      const value = designer.getFormPropertyValueForCurrentLang("codbi-prop-enable");
      if (value === "1" || value === 1 || value === true) {
        return true;
      }
    } catch {
      // fall through to the DOM checkbox check below
    }
  }
  // After an inference-driven form load (no page reload) the property model can be stale even
  // though the live "CodBi" checkbox is still checked — trust the checkbox in that case.
  const checkbox = document.querySelector<HTMLInputElement>("#form-codbi-prop-enable-input");

  if (checkbox && checkbox.checked === true) {
    return true;
  }
  // Neither the (possibly stale) property model nor a checked live checkbox confirm it — e.g. right
  // after an inference-driven in-place form load, when the checkbox may still show the pre-load
  // state. A manual ALT+A open within the last few minutes is a strong signal that CodBi is enabled
  // for the currently edited form.
  try {
    const lastOpened = Number(localStorage.getItem("codbi-assistant-last-opened") ?? "0");
    return lastOpened > 0 && Date.now() - lastOpened < 10 * 60 * 1000;
  } catch {
    return false;
  }
}
