import { instance as getDesignerInstance } from "@de-xima/fc-form-designer";

/**
 * Loads the `cb-manager.js` Angular bundle (which also defines `cb-ai-assistant`)
 * and wires the ALT+A hotkey to dispatch a `codbi:ai-assistant:open` event.
 *
 * The hotkey only opens the assistant when the "CodBi" checkbox (the
 * `codbi-prop-enable` form property) is enabled for the currently edited form.
 *
 * All dialog logic has been moved to the `AiAssistant` Angular component inside
 * the `codbi-apidoc` Angular project.
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

  // Mount the custom elements once. cb-ai-assistant-log is mounted here too (and not only on
  // demand) so that its ngOnInit runs on every designer page load: when the AI assistant creates a
  // workflow, the designer reloads the page, and the change-log component must be present after the
  // reload to pick up a pending sensitive-element highlight persisted in sessionStorage.
  if (!document.querySelector("cb-ai-assistant")) {
    document.body.appendChild(document.createElement("cb-ai-assistant"));
  }
  if (!document.querySelector("cb-ai-assistant-log")) {
    document.body.appendChild(document.createElement("cb-ai-assistant-log"));
  }
  if (!document.querySelector("cb-prompt-manager")) {
    document.body.appendChild(document.createElement("cb-prompt-manager"));
  }

  // Robust auto-open of the change log after a workflow-triggered form reload. Two independent
  // triggers (so it works even if the Angular ngOnInit timing is missed after the reload):
  //  1. A pending localStorage value ("codbi-log-sensitive-elements") written by the assistant right
  //     before window.location.reload(). We keep dispatching the open event until the change-log
  //     component consumes it (it removes the value when it opens).
  //  2. The database itself: once the change-log bundle is loaded, query the newest log entry; if it
  //     used sensitive elements within the last few minutes, dispatch the open event.
  const pendingKey = "codbi-log-sensitive-elements";
  const openEvent = "codbi:ai-assistant-log:open";

  const tryOpenPending = (): void => {
    const pending = localStorage.getItem(pendingKey);
    if (!pending) return;
    let elements: string[] = [];
    try {
      const parsed = JSON.parse(pending) as unknown;
      elements = Array.isArray(parsed) ? (parsed as unknown[]).filter((e): e is string => typeof e === "string") : [];
    } catch {
      // ignore malformed payload
    }
    if (elements.length === 0) return;
    document.dispatchEvent(new CustomEvent(openEvent, { detail: { elements } }));
    // Keep dispatching until the change-log component removes the pending value on open.
    window.setTimeout(tryOpenPending, 500);
  };

  let dbChecked = false;
  const tryOpenRecentDb = (attempt: number): void => {
    if (dbChecked || attempt > 6) return;
    // If a pending value exists, the localStorage path drives the open.
    if (localStorage.getItem(pendingKey)) return;
    window.setTimeout(() => {
      fetch(`${baseURL}plugin?name=CodBi_AICodBiAssistant`, { headers: { "X-Action": "Log" } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((payload: unknown) => {
          const p = payload as Record<string, unknown> | null;
          const entries = (p?.["entries"] as Array<Record<string, unknown>> | undefined) ?? [];
          const newest = entries[0];
          if (!newest) return;
          const used = newest["sensitiveUsed"];
          if (!Array.isArray(used) || used.length === 0) return;
          const ts = String(newest["ts"] ?? "");
          const normalized = ts.includes(" ") ? ts.replace(" ", "T") : ts;
          const date = new Date(normalized);
          if (Number.isNaN(date.getTime())) return;
          const ageMin = (Date.now() - date.getTime()) / 60000;
          if (ageMin < 0 || ageMin > 10) return;
          dbChecked = true;
          document.dispatchEvent(new CustomEvent(openEvent, { detail: { elements: used.map((x) => String(x)) } }));
        })
        .catch(() => tryOpenRecentDb(attempt + 1));
    }, 700);
  };

  window.setTimeout(tryOpenPending, 800);
  window.setTimeout(() => tryOpenRecentDb(0), 1500);

  // ALT+A => show the AI assistant (only when CodBi is enabled for the current form)
  document.addEventListener("keyup", (event) => {
    if (event.altKey && event.key.toLowerCase() === "a" && isCodBiEnabled()) {
      document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
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
