// (no imports needed — all logic lives in the AiAssistant Angular component)

/**
 * Loads the `cb-manager.js` Angular bundle (which also defines `cb-ai-assistant`)
 * and wires the ALT+A hotkey to dispatch a `codbi:ai-assistant:open` event.
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

  // Mount the custom elements once
  if (!document.querySelector("cb-ai-assistant")) {
    document.body.appendChild(document.createElement("cb-ai-assistant"));
  }
  if (!document.querySelector("cb-prompt-manager")) {
    document.body.appendChild(document.createElement("cb-prompt-manager"));
  }

  // ALT+A => show the AI assistant
  document.addEventListener("keyup", (event) => {
    if (event.altKey && event.key.toLowerCase() === "a") {
      document.dispatchEvent(new CustomEvent("codbi:ai-assistant:open"));
    }
  });
}
