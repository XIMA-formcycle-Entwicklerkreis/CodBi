import { createApplication } from "@angular/platform-browser"; // For creating application ref
import { createCustomElement } from "@angular/elements"; // To create the custom element definition
import { appConfig } from "./app/app.config"; // Your application's config (e.g., providers)
import { Manager } from "./app/manager/manager"; // Your main component to be converted to a web component
import { AiAssistant } from "./app/ai-assistant/ai-assistant"; // Unified AI assistant dialog

(async () => {
  const appRef = await createApplication(appConfig);

  customElements.define("cb-manager", createCustomElement(Manager, { injector: appRef.injector }));
  customElements.define("cb-ai-assistant", createCustomElement(AiAssistant, { injector: appRef.injector }));
})().catch((err) => console.error("Error defining custom elements:", err));
